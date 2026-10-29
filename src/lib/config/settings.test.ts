import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getAuthSettings,
  getServerSettings,
  resetAuthSettingsCache,
  resetServerSettingsCache,
} from './settings';

describe('Centralized Typed Server Settings Module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetServerSettingsCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetServerSettingsCache();
  });

  it('provides safe defaults when environment variables are unset', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY;
    delete process.env.RATE_LIMIT_PER_MIN;

    const settings = getServerSettings();
    expect(settings.geminiApiKey).toBe('');
    expect(settings.geminiModel).toBe('gemini-2.5-flash');
    expect(settings.rateLimitPerMin).toBe(60);
    expect(settings.isGeminiConfigured).toBe(false);
    expect(settings.isPlacesConfigured).toBe(false);
  });

  it('reads and validates configured environment values accurately', () => {
    process.env.GEMINI_API_KEY = 'test_gemini_key_123';
    process.env.GEMINI_MODEL = 'gemini-2.5-pro';
    process.env.GOOGLE_PLACES_API_KEY = 'test_places_key_456';
    process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY = 'test_browser_key_789';
    process.env.RATE_LIMIT_PER_MIN = '120';

    const settings = getServerSettings();
    expect(settings.geminiApiKey).toBe('test_gemini_key_123');
    expect(settings.geminiModel).toBe('gemini-2.5-pro');
    expect(settings.googlePlacesApiKey).toBe('test_places_key_456');
    expect(settings.mapsBrowserKey).toBe('test_browser_key_789');
    expect(settings.rateLimitPerMin).toBe(120);
    expect(settings.isGeminiConfigured).toBe(true);
    expect(settings.isPlacesConfigured).toBe(true);
    expect(settings.isMapsBrowserConfigured).toBe(true);
  });

  it('memoizes settings across identical calls and invalidates on env change', () => {
    process.env.GEMINI_API_KEY = 'key_alpha';
    const first = getServerSettings();
    const second = getServerSettings();
    expect(first).toBe(second);

    process.env.GEMINI_API_KEY = 'key_beta';
    const third = getServerSettings();
    expect(third).not.toBe(first);
    expect(third.geminiApiKey).toBe('key_beta');
  });
});

describe('Auth settings (server-only)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetAuthSettingsCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetAuthSettingsCache();
  });

  it('provides safe defaults when auth environment variables are unset', () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.DATABASE_URL;

    const settings = getAuthSettings();
    expect(settings.nextAuthSecret).toBe('');
    expect(settings.nextAuthUrl).toBe('');
    expect(settings.googleClientId).toBe('');
    expect(settings.isNextAuthConfigured).toBe(false);
    expect(settings.isStripeConfigured).toBe(false);
    expect(settings.isDatabaseConfigured).toBe(false);
  });

  it('reads and validates configured auth environment values accurately', () => {
    process.env.NEXTAUTH_SECRET = 'nextauth_secret_test';
    process.env.NEXTAUTH_URL = 'https://jashn.example.com';
    process.env.GOOGLE_CLIENT_ID = 'google_client_id';
    process.env.GOOGLE_CLIENT_SECRET = 'google_client_secret';
    process.env.GITHUB_CLIENT_ID = 'github_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'github_client_secret';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/jashn';

    const settings = getAuthSettings();
    expect(settings.nextAuthSecret).toBe('nextauth_secret_test');
    expect(settings.nextAuthUrl).toBe('https://jashn.example.com');
    expect(settings.googleClientId).toBe('google_client_id');
    expect(settings.githubClientId).toBe('github_client_id');
    expect(settings.stripeSecretKey).toBe('sk_test_123');
    expect(settings.isNextAuthConfigured).toBe(true);
    expect(settings.isStripeConfigured).toBe(true);
    expect(settings.isDatabaseConfigured).toBe(true);
  });

  it('memoizes auth settings across identical calls and invalidates on env change', () => {
    process.env.NEXTAUTH_SECRET = 'secret_alpha';
    process.env.NEXTAUTH_URL = 'https://a.example.com';
    const first = getAuthSettings();
    const second = getAuthSettings();
    expect(first).toBe(second);

    process.env.NEXTAUTH_SECRET = 'secret_beta';
    const third = getAuthSettings();
    expect(third).not.toBe(first);
    expect(third.nextAuthSecret).toBe('secret_beta');
  });

  it('treats missing NEXTAUTH_SECRET or NEXTAUTH_URL as not configured', () => {
    process.env.NEXTAUTH_SECRET = 'secret_alpha';
    process.env.NEXTAUTH_URL = '';
    expect(getAuthSettings().isNextAuthConfigured).toBe(false);

    process.env.NEXTAUTH_SECRET = '';
    process.env.NEXTAUTH_URL = 'https://a.example.com';
    expect(getAuthSettings().isNextAuthConfigured).toBe(false);
  });
});
