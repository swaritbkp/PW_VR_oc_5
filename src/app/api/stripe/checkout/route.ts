import { NextResponse } from 'next/server';
import { getServerSessionUserId } from '../../../../server/auth/session';
import { getStripe } from '../../../../server/billing/stripe';
import {
  unauthorizedResponse,
  serviceUnavailableResponse,
  internalErrorResponse,
} from '../../apiHelpers';

const DEFAULT_PRICE_ID = 'price_pro_monthly_placeholder';
const DEFAULT_QUANTITY = 1;
const BASE_URL = 'http://localhost:3000';

interface CheckoutBody {
  readonly priceId?: string;
  readonly quantity?: number;
}

function origin(req: Request): string {
  return req.headers.get('origin') ?? BASE_URL;
}

async function parseCheckoutBody(req: Request): Promise<CheckoutBody> {
  try {
    return (await req.json()) ?? {};
  } catch {
    return {};
  }
}

/** Creates a Stripe Checkout session for a Pro upgrade (stubbed until keys configured). */
export async function POST(_req: Request): Promise<Response> {
  const userId = await getServerSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }
  const stripe = getStripe();
  if (!stripe) {
    return serviceUnavailableResponse('Stripe billing is not configured. Set STRIPE_SECRET_KEY to enable Pro checkout.');
  }
  const { priceId, quantity } = await parseCheckoutBody(_req);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId ?? DEFAULT_PRICE_ID, quantity: quantity ?? DEFAULT_QUANTITY }],
      success_url: `${origin(_req)}/billing/success`,
      cancel_url: `${origin(_req)}/billing/cancel`,
      client_reference_id: userId,
    });
    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id }, { status: 200 });
  } catch {
    return internalErrorResponse('Checkout failed');
  }
}
