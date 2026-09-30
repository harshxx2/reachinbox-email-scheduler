import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { env } from '../config/env';

export const EMAIL_QUEUE_NAME = 'email-send';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: env.maxJobAttempts,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 7 * 24 * 3600, count: 10000 },
    removeOnFail: { age: 14 * 24 * 3600 },
  },
});
