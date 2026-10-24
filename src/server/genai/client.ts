import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

let cachedClient: GoogleGenAI | null = null;

/** Returns the configured Gemini model identifier. */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/** Checks whether GEMINI_API_KEY is available in server environment. */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
}

/**
 * Returns a singleton instance of the official GoogleGenAI client,
 * or null if GEMINI_API_KEY is not configured.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}
