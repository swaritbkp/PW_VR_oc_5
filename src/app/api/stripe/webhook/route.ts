import { NextResponse } from 'next/server';
import { getStripe, getStripeWebhookSecret } from '../../../../server/billing/stripe';

const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_SERVICE_UNAVAILABLE = 503;

/** Handles Stripe webhook events (stubbed until keys configured). */
export async function POST(req: Request): Promise<Response> {
  const stripe = getStripe();
  const secret = getStripeWebhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json(
      { ok: false, code: 'STRIPE_NOT_CONFIGURED', error: 'Stripe billing is not configured' },
      { status: STATUS_SERVICE_UNAVAILABLE },
    );
  }
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { ok: false, code: 'MISSING_SIGNATURE', error: 'Stripe signature header is required' },
      { status: STATUS_BAD_REQUEST },
    );
  }
  const raw = await req.text();
  try {
    const event = stripe.webhooks.constructEvent(raw, signature, secret);
    return NextResponse.json({ ok: true, received: event.type }, { status: STATUS_OK });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_SIGNATURE',
        error: err instanceof Error ? err.message : 'Invalid webhook signature',
      },
      { status: STATUS_BAD_REQUEST },
    );
  }
}
