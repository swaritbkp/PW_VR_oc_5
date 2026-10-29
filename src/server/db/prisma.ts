import { PrismaClient } from '@prisma/client';
import { getAuthSettings } from '../../lib/config/settings';

let cachedPrisma: PrismaClient | null = null;

/**
 * Returns a singleton Prisma Client instance scoped to the server.
 * Prevents multiple client instances in Next.js hot-reloading dev mode and
 * surfaces a clear degradation path when DATABASE_URL is not configured.
 *
 * @returns PrismaClient instance, or null when the database is not configured
 */
export function getPrisma(): PrismaClient | null {
  const settings = getAuthSettings();
  if (!settings.isDatabaseConfigured) {
    return null;
  }
  if (!cachedPrisma) {
    cachedPrisma = new PrismaClient();
  }
  return cachedPrisma;
}

/** Checks whether a persistent database connection is available. */
export function isDatabaseAvailable(): boolean {
  return getPrisma() !== null;
}
