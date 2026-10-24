---
trigger: always_on
---
# Security rules
- Server-only: GEMINI_API_KEY, GOOGLE_PLACES_API_KEY. The only public key is NEXT_PUBLIC_MAPS_BROWSER_KEY, restricted
  by HTTP referrer and to the Maps JavaScript API. No other NEXT_PUBLIC key, secret or token.
- zod-validate requests, model output, Places responses and localStorage. Reject, never coerce silently.
- Caps: style 300, non-negotiable 80 (max 5), city 60, request body 8 KB. Strip control chars.
- Prompts: user text only inside <user_data>, marked untrusted. Model has no tools. Output schema-constrained.
- Rate limit per IP on /api/plan, /api/advise, /api/vendors/*, /api/geo with a bounded (LRU) store. 429 + Retry-After.
- Headers: CSP (allow the Maps JS hosts and img sources you need, nothing broader), X-Content-Type-Options,
  Referrer-Policy, frame-ancestors none, Permissions-Policy (geolocation self).
- Never dangerouslySetInnerHTML. Never log prompts, notes, keys, PII or full Places responses.
- Contact links are built from validated phone numbers only (tel:, wa.me). The app never sends messages.
