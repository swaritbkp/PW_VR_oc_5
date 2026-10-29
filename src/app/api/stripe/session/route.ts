import { NextResponse } from 'next/server';
import { getServerSessionUserId } from '../../../../server/auth/session';
import { getStripe } from '../../../../server/billing/stripe';

const STATUS_OK = 200;
const STATUS_UNAUTHORIZED = 401;
const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;
const STATUS_SERVICE_UNAVAILABLE = 503;

/** Retrieves a Stripe Checkout session (stubbed until keys configured). */
export async function GET(_req: Request): Promise<Response> {
  const userId = await getServerSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { ok: false, code: 'UNAUTHORIZED', error: 'Authentication required' },
      { status: STATUS_UNAUTHORIZED },
    );
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { ok: false, code: 'STRIPE_NOT_CONFIGURED', error: 'Stripe billing is not configured' },
      { status: STATUS_SERVICE_UNAVAILABLE },
    );
  }
  const sessionId = new URL(_req.url).searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, code: 'MISSING_PARAMETER', error: 'session_id is required' },
      { status: STATUS_BAD_REQUEST },
    );
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({ ok: true, session }, { status: STATUS_OK });
  } catch {
    return NextResponse.json(
      { ok: false, code: 'NOT_FOUND', error: 'Checkout session not found' },
      { status: STATUS_NOT_FOUND },
    );
  }
}
