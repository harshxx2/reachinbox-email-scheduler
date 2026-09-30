import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const raw = process.env.ETHEREAL_SENDERS_JSON ?? '[]';
  const senders = JSON.parse(raw) as Array<{ email: string; username: string; password: string }>;

  for (const sender of senders) {
    await prisma.sender.upsert({
      where: { email: sender.email },
      update: { active: true },
      create: { email: sender.email, active: true },
    });
  }

  console.log(`Upserted ${senders.length} Ethereal sender(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
