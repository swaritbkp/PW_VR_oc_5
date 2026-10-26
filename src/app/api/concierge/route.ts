import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/server/security/rateLimit';
import { detectOffTopicOrUnsafe, detectPromptInjection, redactPii } from '@/lib/security/guardrails';
import { parseAgentCommand } from '@/lib/concierge/agentActions';

const MAX_BODY_BYTES = 8192;
const MAX_MESSAGE_CHARS = 1500;

const ConciergeRequestSchema = z.object({
  message: z.string().min(1).max(MAX_MESSAGE_CHARS),
});

const AgentActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mutate_guests'), guests: z.number() }),
  z.object({ type: z.literal('mutate_budget'), budgetInr: z.number() }),
  z.object({
    type: z.literal('add_task'),
    name: z.string(),
    days: z.number().optional(),
    critical: z.boolean().optional(),
    category: z.string().optional(),
  }),
  z.object({ type: z.literal('navigate_tab'), tab: z.enum(['roadmap', 'vendors', 'graph']) }),
  z.object({
    type: z.literal('open_modal'),
    modal: z.enum(['chaos', 'redflags', 'negotiate', 'whatif', 'templates', 'dossier', 'budget']),
  }),
  z.object({ type: z.literal('set_city'), city: z.string() }),
]);

const ConciergeResponseSchema = z.object({
  ok: z.boolean(),
  reply: z.string(),
  actions: z.array(AgentActionSchema),
  executionLog: z.array(z.string()),
  piiRedacted: z.boolean().optional(),
  error: z.string().optional(),
});

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  return realIp ? realIp.trim() : '127.0.0.1';
}

function validateGuardrails(message: string): { ok: boolean; error?: string; cleanText: string } {
  const injection = detectPromptInjection(message);
  if (injection.isInjection) {
    return { ok: false, error: 'Adversarial prompt injection rejected by guardrails.', cleanText: message };
  }
  const unsafe = detectOffTopicOrUnsafe(message);
  if (unsafe.isUnsafe) {
    return { ok: false, error: 'Off-topic or harmful request rejected by guardrails.', cleanText: message };
  }
  const pii = redactPii(message);
  return { ok: true, cleanText: pii.text };
}

interface ParsedPayload {
  readonly ok: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly status?: number;
}

function parseJsonPayload(rawText: string): ParsedPayload {
  if (rawText.length > MAX_BODY_BYTES) {
    return { ok: false, error: 'Payload exceeds 8 KB limit', status: 413 };
  }
  try {
    const json = JSON.parse(rawText);
    const parsed = ConciergeRequestSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input', status: 400 };
    }
    return { ok: true, message: parsed.data.message };
  } catch {
    return { ok: false, error: 'Malformed JSON payload', status: 400 };
  }
}

/** Handles conversational AI copilot and app navigation queries with security guardrails. */
export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  const payload = parseJsonPayload(await req.text());
  if (!payload.ok || !payload.message) {
    return NextResponse.json({ ok: false, error: payload.error }, { status: payload.status ?? 400 });
  }

  const check = validateGuardrails(payload.message);
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
  }

  const result = parseAgentCommand(check.cleanText);
  const verified = ConciergeResponseSchema.safeParse({
    ok: true,
    reply: result.reply,
    actions: result.actions,
    executionLog: result.executionLog,
    piiRedacted: result.piiRedacted,
  });
  if (!verified.success) {
    return NextResponse.json({ ok: false, error: 'Response schema violation' }, { status: 500 });
  }

  return NextResponse.json(verified.data, { status: 200 });
}
