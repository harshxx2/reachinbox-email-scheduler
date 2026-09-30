import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../config/database';
import { env } from '../config/env';

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Google account did not provide an email'));

          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              name: profile.displayName,
              email,
              avatarUrl: profile.photos?.[0]?.value,
            },
            create: {
              googleId: profile.id,
              name: profile.displayName,
              email,
              avatarUrl: profile.photos?.[0]?.value,
            },
          });
          return done(null, user.id);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );

  passport.serializeUser((userId, done) => done(null, userId));
  passport.deserializeUser(async (userId, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: String(userId) } });
      done(null, user?.id ?? false);
    } catch (error) {
      done(error);
    }
  });
}

export function isPassportConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret && env.googleCallbackUrl);
}
