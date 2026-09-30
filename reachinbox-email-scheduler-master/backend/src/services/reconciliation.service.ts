import { prisma } from '../config/database';
import { emailQueue } from './queue.service';
import { env } from '../config/env';

/**
 * Repairs the only non-atomic boundary in this design: PostgreSQL commit and
 * BullMQ enqueue cannot share a transaction. On process startup, any SCHEDULED
 * DB row without its durable BullMQ job is safely re-enqueued using its stable
 * jobId. BullMQ's unique job id prevents duplicates if the job already exists.
 */
export async function reconcileScheduledJobs(limit = 10_000) {
  const emails = await prisma.email.findMany({
    where: { status: 'SCHEDULED' },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
    select: { id: true, bullJobId: true, scheduledAt: true, attempts: true },
  });

  let repaired = 0;
  for (const email of emails) {
    if (email.attempts >= env.maxJobAttempts) {
      await prisma.email.update({ where: { id: email.id }, data: { status: 'FAILED', lastError: 'Maximum worker attempts exhausted' } });
      continue;
    }
    const existing = await emailQueue.getJob(email.bullJobId);
    if (existing) continue;

    const delay = Math.max(email.scheduledAt.getTime() - Date.now(), 0);
    await emailQueue.add('send-email', { emailId: email.id }, {
      jobId: email.bullJobId,
      delay,
    });
    repaired += 1;
  }

  return repaired;
}
