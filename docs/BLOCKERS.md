# Blockers log

Format: date | what blocked | impact | fallback applied

2026-10-24 | GEMINI_API_KEY is empty in .env | Live Gemini model calls cannot execute | Offline test fixtures and deterministic template adaptation fallback applied per GenAI contract and AC6/AC17
2026-10-24 | GOOGLE_PLACES_API_KEY is empty in .env | Live Places API search/details routes cannot query Google | AC27 graceful degradation applied: mock vendor fixtures in tests, Google Maps deep search links and manual vendor entry in UI
2026-10-24 | NEXT_PUBLIC_MAPS_BROWSER_KEY is empty in .env | Interactive client-side Google Maps JS cannot render | AC21/AC27 fallback applied: render ranked vendor list view and direct Google Maps navigation deep links
2026-10-24 | gcloud CLI is not installed / authenticated locally | Cannot deploy M0 hello-world directly to Cloud Run | Local production build (next build) and smoke verification executed as local verification until final deployment pass per AGENTS.md
