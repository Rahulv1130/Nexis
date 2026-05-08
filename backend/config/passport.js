import passport from'passport';
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import prisma from './prisma.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.OAUTH_CALLBACK_BASE_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findFirst({
      where: { oauthProvider: 'google', oauthId: profile.id }
    });

    if (!user) {
      const email = profile.emails?.[0]?.value;
      user = await prisma.user.upsert({
        where: { email },
        update: { oauthProvider: 'google', oauthId: profile.id, avatar: profile.photos?.[0]?.value },
        create: {
          email,
          username: `${profile.displayName.replace(/\s+/g, '_').toLowerCase()}_${Date.now().toString(36)}`,
          oauthProvider: 'google',
          oauthId: profile.id,
          avatar: profile.photos?.[0]?.value
        }
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.OAUTH_CALLBACK_BASE_URL}/api/auth/github/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findFirst({
      where: { oauthProvider: 'github', oauthId: String(profile.id) }
    });

    if (!user) {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
      user = await prisma.user.upsert({
        where: { email },
        update: { oauthProvider: 'github', oauthId: String(profile.id), avatar: profile.photos?.[0]?.value },
        create: {
          email,
          username: profile.username || `gh_${Date.now().toString(36)}`,
          oauthProvider: 'github',
          oauthId: String(profile.id),
          avatar: profile.photos?.[0]?.value
        }
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

