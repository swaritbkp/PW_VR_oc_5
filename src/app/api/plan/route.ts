import { NextResponse } from 'next/server';
import { IntakeSchema, type IntakeInput } from '../../../lib/plan/schemas';
import { checkRateLimit } from '../../../server/security/rateLimit';
import { generatePlan } from '../../../server/genai/generate';

const MAX_BODY_BYTES = 8192;
const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_TOO_MANY_REQUESTS = 429;
const STATUS_PAYLOAD_TOO_LARGE = 413;
const STATUS_BAD_GATEWAY = 502;
const STATUS_SERVICE_UNAVAILABLE = 503;
const STATUS_GATEWAY_TIMEOUT = 504;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  return realIp ? realIp.trim() : '127.0.0.1';
}

function resolveErrorCode(code: string): number {
  if (code === 'MISSING_API_KEY') return STATUS_SERVICE_UNAVAILABLE;
  if (code === 'TIMEOUT') return STATUS_GATEWAY_TIMEOUT;
  return STATUS_BAD_GATEWAY;
}

type BodyValidationResult =
  | { ok: true; data: IntakeInput }
  | {
      ok: false;
      status: number;
      payload: { ok: false; code: string; error: string; details?: unknown };
    };

function validateRawBody(rawText: string): BodyValidationResult {
  if (rawText.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      status: STATUS_PAYLOAD_TOO_LARGE,
      payload: { ok: false, code: 'PAYLOAD_TOO_LARGE', error: 'Request body exceeds 8 KB limit' },
    };
  }
  try {
    const jsonBody = JSON.parse(rawText);
    const parseResult = IntakeSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      return {
        ok: false,
        status: STATUS_BAD_REQUEST,
        payload: {
          ok: false,
          code: 'VALIDATION_ERROR',
          error: 'Invalid intake parameters',
          details: parseResult.error.issues,
        },
      };
    }
    return { ok: true, data: parseResult.data };
  } catch {
    return {
      ok: false,
      status: STATUS_BAD_REQUEST,
      payload: { ok: false, code: 'INVALID_JSON', error: 'Malformed JSON payload' },
    };
  }
}

/** Handles living plan generation requests with rate limiting and intake validation. */
export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, code: 'RATE_LIMITED', error: 'Too Many Requests' },
      {
        status: STATUS_TOO_MANY_REQUESTS,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      },
    );
  }

  const rawText = await req.text();
  const validation = validateRawBody(rawText);
  if (!validation.ok) {
    return NextResponse.json(validation.payload, { status: validation.status });
  }

  const genResult = await generatePlan(validation.data);
  if (!genResult.ok) {
    const status = resolveErrorCode(genResult.code);
    return NextResponse.json(
      { ok: false, code: genResult.code, error: genResult.error },
      { status },
    );
  }

  return NextResponse.json({ ok: true, plan: genResult.plan }, { status: STATUS_OK });
}
