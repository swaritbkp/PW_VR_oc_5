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

let cachedSettings: ServerSettings | null = null;
let lastFingerprint = '';

function getEnvFingerprint(): string {
  const env = process.env;
  return [
    env.GEMINI_API_KEY ?? '',
    env.GEMINI_MODEL ?? '',
    env.GOOGLE_PLACES_API_KEY ?? '',
    env.NEXT_PUBLIC_MAPS_BROWSER_KEY ?? '',
    env.RATE_LIMIT_PER_MIN ?? '',
    env.NODE_ENV ?? '',
  ].join('|');
}

function parseRateLimitEnv(val: string | undefined): number {
  if (!val) return DEFAULT_RATE_LIMIT;
  const parsed = parseInt(val, RADIX_DECIMAL);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RATE_LIMIT;
}

function buildSettingsObject(): ServerSettings {
  const geminiApiKey = (process.env.GEMINI_API_KEY ?? '').trim();
  const geminiModel = (process.env.GEMINI_MODEL ?? '').trim() || DEFAULT_MODEL;
  const googlePlacesApiKey = (process.env.GOOGLE_PLACES_API_KEY ?? '').trim();
  const mapsBrowserKey = (process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY ?? '').trim();
  const rateLimitPerMin = parseRateLimitEnv(process.env.RATE_LIMIT_PER_MIN);
  const nodeEnv = (process.env.NODE_ENV ?? 'development').trim();

  const raw = {
    geminiApiKey,
    geminiModel,
    googlePlacesApiKey,
    mapsBrowserKey,
    rateLimitPerMin,
    nodeEnv,
    isGeminiConfigured: geminiApiKey.length > 0,
    isPlacesConfigured: googlePlacesApiKey.length > 0,
    isMapsBrowserConfigured: mapsBrowserKey.length > 0,
  };

  const parsed = ServerSettingsSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }

  return {
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
