import { NextResponse } from 'next/server';
import { EventInputSchema, type EventInput } from '../../server/plan/eventCommands';

const STATUS_OK = 200;
const STATUS_CREATED = 201;
const STATUS_BAD_REQUEST = 400;
const STATUS_UNAUTHORIZED = 401;
const STATUS_NOT_FOUND = 404;
const STATUS_SERVICE_UNAVAILABLE = 503;
const STATUS_INTERNAL_SERVER_ERROR = 500;

/** Returns a 401 JSON response. */
export function unauthorizedResponse(): Response {
  return NextResponse.json(
    { ok: false, code: 'UNAUTHORIZED', error: 'Authentication required' },
    { status: STATUS_UNAUTHORIZED },
  );
}

/** Returns a 500 JSON response. */
export function internalErrorResponse(message: string): Response {
  return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', error: message }, { status: STATUS_INTERNAL_SERVER_ERROR });
}

/** Returns a 503 JSON response. */
export function serviceUnavailableResponse(message: string): Response {
  return NextResponse.json({ ok: false, code: 'SERVICE_UNAVAILABLE', error: message }, { status: STATUS_SERVICE_UNAVAILABLE });
}

/** Returns a 404 JSON response. */
export function notFoundResponse(message = 'Event not found'): Response {
  return NextResponse.json({ ok: false, code: 'NOT_FOUND', error: message }, { status: STATUS_NOT_FOUND });
}

/** Parses and validates an event request body, or returns an error Response. */
export async function parseAndValidateEventBody(
  req: Request,
): Promise<EventInput | Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'INVALID_JSON', error: 'Malformed JSON payload' },
      { status: STATUS_BAD_REQUEST },
    );
  }
  const parsed = EventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: 'VALIDATION_ERROR',
        error: 'Invalid event data',
        details: parsed.error.issues,
      },
      { status: STATUS_BAD_REQUEST },
    );
  }
  return parsed.data;
}

export { STATUS_OK, STATUS_CREATED, STATUS_BAD_REQUEST, STATUS_UNAUTHORIZED, STATUS_NOT_FOUND, STATUS_INTERNAL_SERVER_ERROR };
