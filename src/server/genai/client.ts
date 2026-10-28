import { GoogleGenAI } from '@google/genai';
import { getServerSettings } from '../../lib/config/settings';

let cachedClient: GoogleGenAI | null = null;
let lastApiKey = '';

/** Returns the configured Gemini model identifier. */
export function getGeminiModel(): string {
  return getServerSettings().geminiModel;
}

/** Checks whether GEMINI_API_KEY is available in server environment. */
export function isGeminiConfigured(): boolean {
  return getServerSettings().isGeminiConfigured;
}

/**
 * Returns a singleton instance of the official GoogleGenAI client,
 * or null if GEMINI_API_KEY is not configured.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const settings = getServerSettings();
  if (!settings.isGeminiConfigured) {
    return null;
  }
  if (!cachedClient || lastApiKey !== settings.geminiApiKey) {
    cachedClient = new GoogleGenAI({ apiKey: settings.geminiApiKey });
    lastApiKey = settings.geminiApiKey;
  }
  return cachedClient;
}
