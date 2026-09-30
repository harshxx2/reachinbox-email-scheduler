import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().max(100).default(5),
  DEFAULT_MIN_DELAY_MS: z.coerce.number().int().nonnegative().default(2000),
  DEFAULT_HOURLY_LIMIT: z.coerce.number().int().positive().default(100),
  MAX_JOB_ATTEMPTS: z.coerce.number().int().positive().max(50).default(5),
  ETHEREAL_SENDERS_JSON: z.string().default('[]'),
});

const parsed = schema.parse(process.env);

export const env = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  frontendUrl: parsed.FRONTEND_URL,
  sessionSecret: parsed.SESSION_SECRET,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  googleClientId: parsed.GOOGLE_CLIENT_ID,
  googleClientSecret: parsed.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: parsed.GOOGLE_CALLBACK_URL,
  workerConcurrency: parsed.WORKER_CONCURRENCY,
  defaultMinDelayMs: parsed.DEFAULT_MIN_DELAY_MS,
  defaultHourlyLimit: parsed.DEFAULT_HOURLY_LIMIT,
  maxJobAttempts: parsed.MAX_JOB_ATTEMPTS,
  etherealSendersJson: parsed.ETHEREAL_SENDERS_JSON,
};

export type SenderConfig = { email: string; username: string; password: string };

export function senderConfigs(): SenderConfig[] {
  const parsed = JSON.parse(env.etherealSendersJson) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item): item is SenderConfig =>
      !!item && typeof item === 'object' &&
      typeof (item as SenderConfig).email === 'string' &&
      typeof (item as SenderConfig).username === 'string' &&
      typeof (item as SenderConfig).password === 'string',
  );
}
