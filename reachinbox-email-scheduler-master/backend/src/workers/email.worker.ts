import { DelayedError, Worker, Job } from 'bullmq';
import { prisma } from '../config/database';
import { createRedisConnection } from '../config/redis';
import { env } from '../config/env';
import { EMAIL_QUEUE_NAME } from '../services/queue.service';
import { nextUtcHourTimestamp, reserveHourlySlot, waitForGlobalSpacing } from '../services/rate-limit.service';
import { sendViaEthereal } from '../services/smtp.service';
import { reconcileScheduledJobs } from '../services/reconciliation.service';
import { getSenderCredentials } from '../services/sender.service';

async function processEmail(job: Job<{ emailId: string }>) {
  const email = await prisma.email.findUnique({ where: { id: job.data.emailId }, include: { sender: true, campaign: true } });
  if (!email) return;

  if (email.status === 'SENT') return;

  await waitForGlobalSpacing(email.campaign.delayMs);

  const quotaAvailable = await reserveHourlySlot(email.senderId, email.campaign.hourlyLimit);
  if (!quotaAvailable) {
    const nextHour = nextUtcHourTimestamp();
    await prisma.email.update({
      where: { id: email.id },
      data: { scheduledAt: new Date(nextHour) },
    });
    await job.moveToDelayed(nextHour, job.token);
    throw new DelayedError();
  }

  const claim = await prisma.email.updateMany({
    where: { id: email.id, status: { in: ['SCHEDULED', 'PROCESSING'] } },
    data: { status: 'PROCESSING', attempts: { increment: 1 }, processingToken: job.id },
  });

  if (!claim.count) return;

  try {
    const result = await sendViaEthereal({
      sender: getSenderCredentials(email.sender.email),
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
    });

    await prisma.email.updateMany({
      where: { id: email.id, status: 'PROCESSING', processingToken: job.id },
      data: { status: 'SENT', sentAt: new Date(), lastError: result.previewUrl ? `Ethereal preview: ${result.previewUrl}` : null },
    });
  } catch (error) {
    await prisma.email.updateMany({
      where: { id: email.id, processingToken: job.id },
      data: { status: 'SCHEDULED', lastError: error instanceof Error ? error.message : 'SMTP send failed' },
    });
    throw error;
  }
}

void reconcileScheduledJobs().then((repaired) => console.log(`Worker reconciled ${repaired} scheduled BullMQ job(s).`)).catch((error) => console.error('Queue reconciliation failed', error));

const worker = new Worker(EMAIL_QUEUE_NAME, processEmail, {
  connection: createRedisConnection(),
  concurrency: env.workerConcurrency,
});

worker.on('completed', (job) => console.log(`email job completed: ${job.id}`));
worker.on('failed', async (job, error) => {
  console.error(`email job failed: ${job?.id}`, error);
  if (job && job.attemptsMade >= Number(job.opts.attempts ?? 1)) {
    await prisma.email.updateMany({
      where: { bullJobId: job.id, status: { in: ['SCHEDULED', 'PROCESSING'] } },
      data: { status: 'FAILED', lastError: error.message },
    });
  }
});
worker.on('error', (error) => console.error('worker error', error));

async function shutdown(signal: string) {
  console.log(`${signal}: shutting down worker`);
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
