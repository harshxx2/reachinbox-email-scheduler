import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import { redis } from './config/redis';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { emailRouter } from './routes/email.routes';
import { prisma } from './config/database';
import { configurePassport } from './services/auth.service';

configurePassport();

export const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, _res, next) => {
  req.userId = typeof req.user === 'string' ? req.user : undefined;
  next();
});

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  await redis.ping();
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/emails', emailRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});
