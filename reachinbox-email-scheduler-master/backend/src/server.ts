import { app } from './app';
import { env, senderConfigs } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { syncConfiguredSenders } from './services/sender.service';
import { reconcileScheduledJobs } from './services/reconciliation.service';

async function main() {
  await prisma.$connect();
  await redis.ping();
  await syncConfiguredSenders();
  const repaired = await reconcileScheduledJobs();
  console.log(`Reconciled ${repaired} scheduled BullMQ job(s).`);

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`Configured Ethereal senders: ${senderConfigs().length}`);
  });
}

main().catch(async (error) => {
  console.error('Failed to start API', error);
  await prisma.$disconnect();
  process.exit(1);
});
