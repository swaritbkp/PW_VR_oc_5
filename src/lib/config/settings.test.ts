import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getServerSettings, resetServerSettingsCache } from './settings';

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
