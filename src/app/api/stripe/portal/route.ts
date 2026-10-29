import { NextResponse } from 'next/server';
import { getServerSessionUserId } from '../../../../server/auth/session';
import { getStripe } from '../../../../server/billing/stripe';
import {
  unauthorizedResponse,
  serviceUnavailableResponse,
  internalErrorResponse,
} from '../../apiHelpers';

const BASE_URL = 'http://localhost:3000';

interface PortalBody {
  readonly customerId?: string;
}

function origin(req: Request): string {
  return req.headers.get('origin') ?? BASE_URL;
}

async function parsePortalBody(req: Request): Promise<PortalBody> {
  try {
    return (await req.json()) ?? {};
  } catch {
    return {};
  }
}

/** Opens a Stripe Customer Portal session (stubbed until keys configured). */
export async function POST(_req: Request): Promise<Response> {
  const userId = await getServerSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }
  const stripe = getStripe();
  if (!stripe) {
    return serviceUnavailableResponse('Stripe billing is not configured');
  }
  const { customerId } = await parsePortalBody(_req);
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId ?? '',
      return_url: `${origin(_req)}/billing`,
    });
    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  } catch {
    return internalErrorResponse('Portal failed');
  }
}
