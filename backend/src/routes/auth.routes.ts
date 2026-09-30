import { Router } from 'express';
import { googleCallback, googleStart, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();
authRouter.get('/google', googleStart);
authRouter.get('/google/callback', googleCallback);
authRouter.get('/me', requireAuth, me);
authRouter.post('/logout', requireAuth, logout);
