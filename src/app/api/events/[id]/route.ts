import { NextResponse } from 'next/server';
import { getServerSessionUserId } from '../../../../server/auth/session';
import { getEvent } from '../../../../server/plan/eventQueries';
import { updateEvent, deleteEvent, duplicateEvent } from '../../../../server/plan/eventCommands';
import {
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
  parseAndValidateEventBody,
} from '../../apiHelpers';

async function resolveUserId(): Promise<string | null> {
  return getServerSessionUserId();
}

/** Returns a single event owned by the authenticated user. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ readonly id: string }> },
): Promise<Response> {
  const userId = await resolveUserId();
  if (!userId) {
    return unauthorizedResponse();
  }
  const { id } = await params;
  const event = await getEvent(id, userId);
  if (!event) {
    return notFoundResponse();
  }
  return NextResponse.json({ ok: true, event }, { status: 200 });
}

/** Updates an event owned by the authenticated user. */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ readonly id: string }> },
): Promise<Response> {
  const userId = await resolveUserId();
  if (!userId) {
    return unauthorizedResponse();
  }
  const { id } = await params;
  const body = await parseAndValidateEventBody(_req);
  if (body instanceof Response) {
    return body;
  }
  const event = await updateEvent(id, userId, body);
  if (!event) {
    return notFoundResponse();
  }
  return NextResponse.json({ ok: true, event }, { status: 200 });
}

/** Soft-deletes an event owned by the authenticated user. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ readonly id: string }> },
): Promise<Response> {
  const userId = await resolveUserId();
  if (!userId) {
    return unauthorizedResponse();
  }
  const { id } = await params;
  const deleted = await deleteEvent(id, userId);
  if (!deleted) {
    return notFoundResponse();
  }
  return NextResponse.json({ ok: true, id }, { status: 200 });
}

/** Duplicates an event owned by the authenticated user. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ readonly id: string }> },
): Promise<Response> {
  const userId = await resolveUserId();
  if (!userId) {
    return unauthorizedResponse();
  }
  const { id } = await params;
  try {
    const duplicated = await duplicateEvent(id, userId);
    if (!duplicated) {
      return notFoundResponse();
    }
    return NextResponse.json({ ok: true, event: duplicated }, { status: 200 });
  } catch {
    return internalErrorResponse('Failed to duplicate event');
  }
}
