import NextAuth from 'next-auth';
import { getNextAuthOptions } from '../../../../server/auth/auth';

/** NextAuth.js authentication endpoint handling sign-in, sign-out, callbacks and session. */
export const GET = NextAuth(getNextAuthOptions());

/** NextAuth.js authentication endpoint handling sign-in, sign-out, callbacks and session. */
export const POST = NextAuth(getNextAuthOptions());
