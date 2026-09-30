import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'Authentication required' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ message: 'User session is no longer valid' });

  req.currentUser = user;
  next();
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      currentUser?: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
    }
  }
}
