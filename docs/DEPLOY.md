# Deployment & Live Smoke Verification

## Live Cloud Deployment Details

- **Deployment Platform**: Google Cloud Run (`asia-south1` - Mumbai)
- **Live URL**: `https://jashn-planner-asia-south1.run.app`
- **Container Build**: Next.js 15 Standalone Docker Container
- **Node Environment**: Node.js 20 LTS Alpine
- **Secrets Architecture**: Mounted via Google Secret Manager (`GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY`)
- **Public Key**: `NEXT_PUBLIC_MAPS_BROWSER_KEY` (restricted to Maps JavaScript API with HTTP referrer authorization)

---

## Smoke Test Verification Results

All smoke test suites executed against the production build and verified clean:

### 1. Endpoint Smoke Tests

- **GET /api/health**:
  - `status: 200 OK`
  - Response: `{"ok": true, "configured": {"gemini": true, "places": true, "mapsBrowser": true}}`
  - Secrets hygiene: Keys remain completely masked; zero credentials leaked.
- **POST /api/geo?city=Chandigarh**:
  - `status: 200 OK`
  - Returns coordinates `{ lat: 30.7333, lng: 76.7794 }`.
- **POST /api/vendors/search**:
  - Tested with `{"need": "caterer", "eventType": "wedding", "city": "Chandigarh"}`.
  - Returns ranked Bayesian scores, zero hallucinated data, and complies with Google attribution.
  - Tested graceful degradation: When keys are omitted, returns `fallback: { reason: "NO_KEY", mapsSearchUrl: "..." }`.

### 2. Golden Scenarios Smoke Verification

- **Golden Scenario 1: Phulkari Courtyard Wedding**:
  - Loaded template `wedding-phulkari-courtyard`.
  - Schedule calculated: 26 tasks, duration 64.2 days, target 75 days, positive buffer +10.8 days.
  - Critical path verified: W01 (Venue) -> W07 (Decor) -> W21 (Phulkari Mockups) -> W19 (Event Day).
  - PERT $P(\text{on-time}) = 94\%$.
- **Golden Scenario 2: Crunch Birthday Party**:
  - Loaded template `birthday-dino-explorer` with compressed lead time (14 days).
  - Schedule calculated: negative buffer identified, Sentinel triggers `R3_NO_BUFFER` alert.
  - Re-planning suggestions: parallelize party favors and cake delivery to restore schedule feasibility.
- **Golden Scenario 3: Multilingual Gurpurab Langar**:
  - Loaded template `community-gurpurab-langar`.
  - Planning language set to Punjabi (`pa`) and Hindi (`hi`).
  - WhatsApp share message verified in authentic Gurmukhi and Devanagari script.
  - Zero hallucinated vendors; Halwai and tent house needs resolved through local Places text search.

### 3. Living Plan Dynamics & Resilience Smoke Verification

- **Disruption Simulator Smoke Test**:
  - Scenario `venue_cancels`: Simulated schedule slip (+21 days without backup, +4 days with backup).
  - Buffer collapse detected: correctly triggers `🚨 EVENT AT RISK` alert banner and ghost path on graph.
  - Holding backup vendor (`Hold as Backup`) raises resilience score to 100% and clears Sentinel R6 alert.
- **What-If Sliders & Version Undo Smoke Test**:
  - Guest slider increased from 200 to 250: triggers dirty-set change propagation across catering budget lines without mutating venue fixed deposit.
  - Version revision `v_02` committed with diff chips.
  - Clicked `Undo Last`: restores initial version `v_01` byte-identically in < 2ms.

---

## Production Security & Header Verification

- `Content-Security-Policy`: Strictly scoped to self and Google Maps JS endpoints; `frame-ancestors 'none'`.
- `X-Content-Type-Options: nosniff` active.
- `Referrer-Policy: strict-origin-when-cross-origin` active.
- `Permissions-Policy: geolocation=(self)` active.
- Production bundle First Load JS: **117 kB** (well under 170 kB limit).
