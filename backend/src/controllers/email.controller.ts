import { Request, Response } from 'express';
import { z } from 'zod';
import { listScheduled, listSent, scheduleCampaign } from '../services/email.service';
import { prisma } from '../config/database';

const scheduleSchema = z.object({
  subject: z.string().trim().min(1).max(500),
  body: z.string().min(1).max(500_000),
  recipients: z.array(z.string().email()).min(1).max(50_000),
  startTime: z.coerce.date(),
  delayMs: z.coerce.number().int().min(0).max(86_400_000).optional(),
  hourlyLimit: z.coerce.number().int().positive().max(100_000).optional(),
  senderId: z.string().optional(),
  idempotencyKey: z.string().min(8).max(100).optional(),
});

export async function schedule(req: Request, res: Response) {
  try {
    const input = scheduleSchema.parse(req.body);
    if (input.startTime.getTime() < Date.now() - 30_000) {
      return res.status(400).json({ message: 'Start time must be in the future' });
    }

    const result = await scheduleCampaign({ userId: req.userId!, ...input });
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0]?.message ?? 'Invalid payload' });
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to schedule emails' });
  }
}

export async function scheduled(req: Request, res: Response) {
  const emails = await listScheduled(req.userId!);
  return res.json({ emails });
}

export async function sent(req: Request, res: Response) {
  const emails = await listSent(req.userId!);
  return res.json({ emails });
}

export async function getOne(req: Request, res: Response) {
  const email = await prisma.email.findFirst({
    where: { id: String(req.params.id), campaign: { userId: req.userId! } },
    select: {
      id: true,
      recipient: true,
      subject: true,
      body: true,
      scheduledAt: true,
      sentAt: true,
      status: true,
      attempts: true,
      lastError: true,
      sender: { select: { email: true } },
    },
  });
  if (!email) return res.status(404).json({ message: 'Email not found' });
  return res.json({ email });
}
