import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import { getPrisma } from '../db/prisma';

const SALT_LENGTH = 16;
const DERIVED_KEY_LENGTH = 64;
const ITERATIONS = 100_000;
const ENCODING: BufferEncoding = 'hex';

/** Derives a pbkdf2 password hash so credentials login never stores plain text. */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString(ENCODING);
  const derived = pbkdf2Sync(password, salt, ITERATIONS, DERIVED_KEY_LENGTH, ENCODING).toString(
    ENCODING,
  );
  return `${salt}:${derived}`;
}

/** Verifies a plaintext password against a stored salt:hash using constant-time comparison. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, derived] = stored.split(':');
  if (!salt || !derived) {
    return false;
  }
  const candidate = pbkdf2Sync(password, salt, ITERATIONS, DERIVED_KEY_LENGTH, ENCODING).toString(
    ENCODING,
  );
  return timingSafeEqual(Buffer.from(candidate, ENCODING), Buffer.from(derived, ENCODING));
}

/** Finds a user by email, or null when the database is unavailable. */
export async function findUserByEmail(email: string): Promise<{
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly passwordHash: string | null;
} | null> {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }
  return { id: user.id, email: user.email, name: user.name, passwordHash: user.passwordHash };
}

/** Creates a user with a hashed password, or null when the database is unavailable. */
export async function createUser(
  email: string,
  password: string,
  name?: string,
): Promise<{
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
} | null> {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }
  const user = await prisma.user.create({
    data: { email, name, passwordHash: hashPassword(password) },
    select: { id: true, email: true, name: true },
  });
  return user;
}
