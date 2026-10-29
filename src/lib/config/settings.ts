import { z } from 'zod';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_RATE_LIMIT = 60;
const RADIX_DECIMAL = 10;

/**
 * Zod validation schema for server-side runtime settings.
 */
export const ServerSettingsSchema = z.object({
  geminiApiKey: z.string(),
  geminiModel: z.string().min(1),
  googlePlacesApiKey: z.string(),
  mapsBrowserKey: z.string(),
  rateLimitPerMin: z.number().int().positive(),
  nodeEnv: z.string(),
  isGeminiConfigured: z.boolean(),
  isPlacesConfigured: z.boolean(),
  isMapsBrowserConfigured: z.boolean(),
});

export type ServerSettings = z.infer<typeof ServerSettingsSchema>;

/**
 * Zod validation schema for server-side authentication settings.
 * All values are server-only secrets or public provider IDs; nothing here is
 * safe to expose to the browser as a NEXT_PUBLIC variable.
 */
export const AuthSettingsSchema = z.object({
  nextAuthSecret: z.string(),
  nextAuthUrl: z.string().url().or(z.literal('')),
  googleClientId: z.string(),
  googleClientSecret: z.string(),
  githubClientId: z.string(),
  githubClientSecret: z.string(),
  stripeSecretKey: z.string(),
  stripeWebhookSecret: z.string(),
  databaseUrl: z.string(),
  isNextAuthConfigured: z.boolean(),
  isStripeConfigured: z.boolean(),
  isDatabaseConfigured: z.boolean(),
});

export type AuthSettings = z.infer<typeof AuthSettingsSchema>;

const emptyServerSettings: ServerSettings = {
  geminiApiKey: '',
  geminiModel: DEFAULT_MODEL,
  googlePlacesApiKey: '',
  mapsBrowserKey: '',
  rateLimitPerMin: DEFAULT_RATE_LIMIT,
  nodeEnv: 'development',
  isGeminiConfigured: false,
  isPlacesConfigured: false,
  isMapsBrowserConfigured: false,
};

const emptyAuthSettings: AuthSettings = {
  nextAuthSecret: '',
  nextAuthUrl: '',
  googleClientId: '',
  googleClientSecret: '',
  githubClientId: '',
  githubClientSecret: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  databaseUrl: '',
  isNextAuthConfigured: false,
  isStripeConfigured: false,
  isDatabaseConfigured: false,
};

let cachedSettings: ServerSettings | null = null;
let lastFingerprint = '';
let cachedAuthSettings: AuthSettings | null = null;
let lastAuthFingerprint = '';

/** Reads and trims a single environment variable, falling back to an empty string. */
function envString(key: string): string {
  return (process.env[key] ?? '').trim();
}

function getEnvFingerprint(): string {
  return [
    envString('GEMINI_API_KEY'),
    envString('GEMINI_MODEL'),
    envString('GOOGLE_PLACES_API_KEY'),
    envString('NEXT_PUBLIC_MAPS_BROWSER_KEY'),
    envString('RATE_LIMIT_PER_MIN'),
    envString('NODE_ENV'),
  ].join('|');
}

function getAuthEnvFingerprint(): string {
  return [
    envString('NEXTAUTH_SECRET'),
    envString('NEXTAUTH_URL'),
    envString('GOOGLE_CLIENT_ID'),
    envString('GOOGLE_CLIENT_SECRET'),
    envString('GITHUB_CLIENT_ID'),
    envString('GITHUB_CLIENT_SECRET'),
    envString('STRIPE_SECRET_KEY'),
    envString('STRIPE_WEBHOOK_SECRET'),
    envString('DATABASE_URL'),
  ].join('|');
}

function parseRateLimitEnv(val: string | undefined): number {
  if (!val) return DEFAULT_RATE_LIMIT;
  const parsed = parseInt(val, RADIX_DECIMAL);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RATE_LIMIT;
}

function buildSettingsObject(): ServerSettings {
  const raw = {
    geminiApiKey: envString('GEMINI_API_KEY'),
    geminiModel: envString('GEMINI_MODEL') || DEFAULT_MODEL,
    googlePlacesApiKey: envString('GOOGLE_PLACES_API_KEY'),
    mapsBrowserKey: envString('NEXT_PUBLIC_MAPS_BROWSER_KEY'),
    rateLimitPerMin: parseRateLimitEnv(envString('RATE_LIMIT_PER_MIN')),
    nodeEnv: envString('NODE_ENV') || 'development',
    isGeminiConfigured: envString('GEMINI_API_KEY').length > 0,
    isPlacesConfigured: envString('GOOGLE_PLACES_API_KEY').length > 0,
    isMapsBrowserConfigured: envString('NEXT_PUBLIC_MAPS_BROWSER_KEY').length > 0,
  };
  const parsed = ServerSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : emptyServerSettings;
}

function buildAuthSettingsObject(): AuthSettings {
  const raw = {
    nextAuthSecret: envString('NEXTAUTH_SECRET'),
    nextAuthUrl: envString('NEXTAUTH_URL'),
    googleClientId: envString('GOOGLE_CLIENT_ID'),
    googleClientSecret: envString('GOOGLE_CLIENT_SECRET'),
    githubClientId: envString('GITHUB_CLIENT_ID'),
    githubClientSecret: envString('GITHUB_CLIENT_SECRET'),
    stripeSecretKey: envString('STRIPE_SECRET_KEY'),
    stripeWebhookSecret: envString('STRIPE_WEBHOOK_SECRET'),
    databaseUrl: envString('DATABASE_URL'),
    isNextAuthConfigured:
      envString('NEXTAUTH_SECRET').length > 0 && envString('NEXTAUTH_URL').length > 0,
    isStripeConfigured: envString('STRIPE_SECRET_KEY').length > 0,
    isDatabaseConfigured: envString('DATABASE_URL').length > 0,
  };
  const parsed = AuthSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : emptyAuthSettings;
}

/**
 * Returns validated, typed authentication settings with memoized caching and safe offline fallbacks.
 * Server-only: never call from client components.
 *
 * @returns Fully validated AuthSettings object
 */
export function getAuthSettings(): AuthSettings {
  const fingerprint = getAuthEnvFingerprint();
  if (cachedAuthSettings && lastAuthFingerprint === fingerprint) {
    return cachedAuthSettings;
  }

  const settings = buildAuthSettingsObject();
  cachedAuthSettings = settings;
  lastAuthFingerprint = fingerprint;
  return settings;
}

/**
 * Resets the in-memory memoized server settings cache.
 * Useful in test suites that alter process.env dynamically.
 */
export function resetServerSettingsCache(): void {
  cachedSettings = null;
  lastFingerprint = '';
}

/**
 * Resets the in-memory memoized auth settings cache.
 * Useful in test suites that alter process.env dynamically.
 */
export function resetAuthSettingsCache(): void {
  cachedAuthSettings = null;
  lastAuthFingerprint = '';
}

/**
 * Returns validated, typed server settings with memoized caching and safe offline fallbacks.
 *
 * @returns Fully validated ServerSettings object
 */
export function getServerSettings(): ServerSettings {
  const fingerprint = getEnvFingerprint();
  if (cachedSettings && lastFingerprint === fingerprint) {
    return cachedSettings;
  }

  const settings = buildSettingsObject();
  cachedSettings = settings;
  lastFingerprint = fingerprint;
  return settings;
}

/**
 * Returns the client-safe public Google Maps browser key.
 *
 * @returns Public Maps browser API key string
 */
export function getClientMapsKey(): string {
  return getServerSettings().mapsBrowserKey;
}
