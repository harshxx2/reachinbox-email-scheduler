import { Request, Response } from 'express';
import passport from 'passport';
import { env } from '../config/env';

export function googleStart(req: Request, res: Response) {
  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(503).json({ message: 'Google OAuth is not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
}

export function googleCallback(req: Request, res: Response, next: (error?: unknown) => void) {
  passport.authenticate('google', (err: unknown, user: string | false) => {
    if (err || !user) return next(err || new Error('Google authentication failed'));
    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError);
      return res.redirect(env.frontendUrl);
    });
  })(req, res, next);
}

export function me(req: Request, res: Response) {
  if (!req.currentUser) return res.status(401).json({ message: 'Not authenticated' });
  return res.json({ user: req.currentUser });
}

export function logout(req: Request, res: Response) {
  req.logout((logoutError) => {
    if (logoutError) return res.status(500).json({ message: 'Logout failed' });
    req.session.destroy((sessionError) => {
      if (sessionError) return res.status(500).json({ message: 'Failed to destroy session' });
      res.clearCookie('connect.sid');
      return res.status(204).send();
    });
  });
}
