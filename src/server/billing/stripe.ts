import Stripe from 'stripe';
import { getAuthSettings } from '../../lib/config/settings';

let cachedStripe: Stripe | null = null;

/**
 * Returns a singleton Stripe client, or null when STRIPE_SECRET_KEY is not
 * configured. No live Stripe calls are made until keys are present.
 */
export function getStripe(): Stripe | null {
  const settings = getAuthSettings();
  if (!settings.isStripeConfigured) {
    return null;
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(settings.stripeSecretKey, {
      apiVersion: '2026-09-30.endive',
    });
  }
  return cachedStripe;
}

/** Checks whether Stripe billing is configured. */
export function isStripeConfigured(): boolean {
  return getAuthSettings().isStripeConfigured;
}

/** Returns the configured Stripe webhook secret, empty when unconfigured. */
export function getStripeWebhookSecret(): string {
  return getAuthSettings().stripeWebhookSecret;
}
