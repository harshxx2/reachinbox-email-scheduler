import { prisma } from '../config/database';
import { senderConfigs, SenderConfig } from '../config/env';

export async function syncConfiguredSenders() {
  for (const sender of senderConfigs()) {
    await prisma.sender.upsert({
      where: { email: sender.email },
      update: { active: true },
      create: { email: sender.email, active: true },
    });
  }
}

export async function getActiveSenders() {
  return prisma.sender.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } });
}

export async function resolveSenderIds(explicitSenderId?: string) {
  if (explicitSenderId) {
    const sender = await prisma.sender.findFirst({ where: { id: explicitSenderId, active: true } });
    if (!sender) throw new Error('Requested sender is not available');
    return [sender.id];
  }

  const senders = await getActiveSenders();
  if (!senders.length) throw new Error('No active Ethereal sender is configured');
  return senders.map((sender: { id: string }) => sender.id);
}

export function getSenderCredentials(email: string): SenderConfig {
  const credentials = senderConfigs().find((sender) => sender.email === email);
  if (!credentials) throw new Error(`No Ethereal credentials configured for ${email}`);
  return credentials;
}
