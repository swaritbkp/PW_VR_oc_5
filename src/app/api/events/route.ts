import { NextResponse } from 'next/server';
import { getServerSessionUserId } from '../../../server/auth/session';
import { listEvents } from '../../../server/plan/eventQueries';
import { createEvent } from '../../../server/plan/eventCommands';
import {
  unauthorizedResponse,
  internalErrorResponse,
  parseAndValidateEventBody,
} from '../apiHelpers';

/** Lists all non-deleted events for the authenticated user. */
export async function GET(_req: Request): Promise<Response> {
  const userId = await getServerSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }
  try {
    const events = await listEvents(userId);
    return NextResponse.json({ ok: true, events }, { status: 200 });
  } catch {
    return internalErrorResponse('Failed to load events');
  }
}

/** Creates a new event scoped to the authenticated user. */
export async function POST(_req: Request): Promise<Response> {
  const userId = await getServerSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }
  const body = await parseAndValidateEventBody(_req);
  if (body instanceof Response) {
    return body;
  }
  try {
    const event = await createEvent(userId, body);
    if (!event) {
      return internalErrorResponse('Database is not configured');
    }
    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION_ERROR', error: 'Invalid event data' },
      { status: 400 },
    );
  }
}
