import { Router } from 'express';
import { getOne, schedule, scheduled, sent } from '../controllers/email.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const emailRouter = Router();
emailRouter.use(requireAuth);
emailRouter.post('/schedule', schedule);
emailRouter.get('/scheduled', scheduled);
emailRouter.get('/sent', sent);
emailRouter.get('/:id', getOne);
