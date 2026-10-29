import type { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { getAuthSettings } from '../../lib/config/settings';
import type { AuthSettings } from '../../lib/config/settings';
import { findUserByEmail, verifyPassword } from './users';

declare module 'next-auth' {
  interface Session {
    user: {
      /** The authenticated user's database id. */
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    /** The authenticated user's database id. */
    id: string;
  }
}

async function authorizeCredentials(
  credentials: Record<string, string> | undefined,
): Promise<{ readonly id: string; readonly email: string; readonly name: string | null } | null> {
  const email = credentials?.email?.trim();
  const password = credentials?.password ?? '';
  if (!email || !password) {
    return null;
  }
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return null;
  }
  return { id: user.id, email: user.email, name: user.name };
}

function buildCredentialsProvider() {
  return CredentialsProvider({
    id: 'credentials',
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      return authorizeCredentials(credentials);
    },
  });
}

/** Builds the auth providers from centralized settings. */
function buildProviders(settings: AuthSettings): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = [buildCredentialsProvider()];
  if (settings.googleClientId && settings.googleClientSecret) {
    providers.push(
      GoogleProvider({
        clientId: settings.googleClientId,
        clientSecret: settings.googleClientSecret,
      }),
    );
  }
  if (settings.githubClientId && settings.githubClientSecret) {
    providers.push(
      GitHubProvider({
        clientId: settings.githubClientId,
        clientSecret: settings.githubClientSecret,
      }),
    );
  }
  return providers;
}

/**
 * Builds NextAuth.js options from centralized auth settings.
 * OAuth2 providers (Google, GitHub) are only registered when their client IDs
 * and secrets are configured; Credentials is always available as a fallback.
 *
 * @returns NextAuthOptions ready for the auth API route handler
 */
export function getNextAuthOptions(): NextAuthOptions {
  const settings = getAuthSettings();
  return {
    providers: buildProviders(settings),
    secret: settings.nextAuthSecret || undefined,
    session: { strategy: 'jwt' },
    pages: { signIn: '/auth/signin', error: '/auth/error' },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        session.user.id = token.id;
        return session;
      },
    },
  };
}
