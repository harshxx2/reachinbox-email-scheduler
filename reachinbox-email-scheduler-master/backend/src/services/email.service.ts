import { prisma } from '../config/database';
import { emailQueue } from './queue.service';
import { env } from '../config/env';
import { resolveSenderIds } from './sender.service';

export async function scheduleCampaign(input: {
  userId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: Date;
  delayMs?: number;
  hourlyLimit?: number;
  senderId?: string;
  idempotencyKey?: string;
}) {
  const delayMs = Math.max(input.delayMs ?? env.defaultMinDelayMs, 0);
  const hourlyLimit = Math.max(input.hourlyLimit ?? env.defaultHourlyLimit, 1);
  const cleanRecipients = [...new Set(input.recipients.map((value) => value.trim().toLowerCase()).filter(Boolean))];
  if (!cleanRecipients.length) throw new Error('At least one recipient is required');

  if (input.idempotencyKey) {
    const existing = await prisma.campaign.findFirst({ where: { userId: input.userId, idempotencyKey: input.idempotencyKey } });
    if (existing) {
      const count = await prisma.email.count({ where: { campaignId: existing.id } });
      return { campaign: existing, created: count };
    }
  }

  const senderIds = await resolveSenderIds(input.senderId);

  const campaign = await prisma.campaign.create({
    data: {
      userId: input.userId,
      subject: input.subject,
      body: input.body,
      startTime: input.startTime,
      delayMs,
      hourlyLimit,
      senderId: input.senderId,
      idempotencyKey: input.idempotencyKey,
    },
  });

  const emailRows = cleanRecipients.map((recipient, index) => ({
    campaignId: campaign.id,
    senderId: senderIds[index % senderIds.length],
    recipient,
    subject: input.subject,
    body: input.body,
    scheduledAt: new Date(input.startTime.getTime() + index * delayMs),
    bullJobId: `email-${campaign.id}-${index}-${crypto.randomUUID()}`,
  }));

  const createdEmails = await prisma.email.createManyAndReturn({ data: emailRows });
  const queuedJobIds: string[] = [];

  try {
    for (const email of createdEmails) {
      const delay = Math.max(email.scheduledAt.getTime() - Date.now(), 0);
      await emailQueue.add('send-email', { emailId: email.id }, {
        jobId: email.bullJobId,
        delay,
      });
      queuedJobIds.push(email.bullJobId);
    }

    return { campaign, created: createdEmails.length };
  } catch (error) {
    await Promise.all(queuedJobIds.map(async (jobId) => {
      const job = await emailQueue.getJob(jobId);
      await job?.remove();
    }));
    await prisma.campaign.delete({ where: { id: campaign.id } });
    throw error;
  }
}

export async function listScheduled(userId: string) {
  return prisma.email.findMany({
    where: { campaign: { userId }, status: { in: ['SCHEDULED', 'PROCESSING'] } },
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      recipient: true,
      subject: true,
      scheduledAt: true,
      status: true,
      sender: { select: { email: true } },
    },
  });
}

export async function listSent(userId: string) {
  return prisma.email.findMany({
    where: { campaign: { userId }, status: { in: ['SENT', 'FAILED'] } },
    orderBy: [{ sentAt: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      recipient: true,
      subject: true,
      sentAt: true,
      status: true,
      lastError: true,
      sender: { select: { email: true } },
    },
  });
}
