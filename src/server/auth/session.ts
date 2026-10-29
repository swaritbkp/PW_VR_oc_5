import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';
import { getAuthSettings } from '../../lib/config/settings';

/** Extracts the authenticated user's id from a NextAuth.js JWT session cookie. */
export async function getServerSessionUserId(): Promise<string | null> {
  const settings = getAuthSettings();
  if (!settings.isNextAuthConfigured) {
    return null;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get('next-auth.session-token')?.value;
  if (!token) {
    return null;
  }
  const secret = settings.nextAuthSecret;
  if (!secret) {
    return null;
  }
  const decoded = await decode({ token, secret });
  const id = decoded?.id;
  return typeof id === 'string' ? id : null;
}

/** Checks whether an authenticated session is present for the current request. */
export async function hasSession(): Promise<boolean> {
  return (await getServerSessionUserId()) !== null;
}
