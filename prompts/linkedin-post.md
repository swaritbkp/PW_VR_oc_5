# LinkedIn Post — Jashn (PromptWars Challenge 5)

Every celebration plan goes stale the day someone changes the guest count, a vendor slips, or it rains.

Planning an Indian celebration—whether an intimate Phulkari courtyard wedding, a vibrant kids' birthday, or a community Gurpurab langar—isn't a static to-do list. It’s an interdependent project network with hard deadlines, strict lead times, and sudden real-world disruptions.

For **PromptWars Challenge 5 (Celebration & Event Planner)**, I built **Jashn (ਜਸ਼ਨ / जश्न)** — an intelligent, date-aware, location-aware living Event Graph.

### 🌟 What I Built

1. **Curated Contemporary Templates**: 12 culturally authentic starting points across weddings, birthdays, and community festivals.
2. **Deterministic PERT/CPM Scheduling**: Pure O(V+E) critical path algorithm, float slack tracking, and seeded Mulberry32 Monte Carlo P(ready) confidence gauges (P50/P80/P90).
3. **Zero Hallucinated Vendors**: Real nearby vendors discovered via Google Places (New) server-side proxies; Bayesian rating & distance ranking; human-initiated contact via `tel:` and multilingual WhatsApp (`wa.me` in English, Hindi, Punjabi).
4. **Plan B Resilience & Disruption Simulator**: Stress-test against venue cancellations, monsoon downpours, or power cuts with ghost path diffs and resilience scoring.
5. **Living Plan Dynamics**: Interactive what-if sliders (guests, budget) with surgical dirty-set change propagation and instant single-click undo/version history.
6. **Multi-Channel Export**: Instant `.ics` calendar export and localized WhatsApp summaries.

---

### 🧠 Architectural Core: "LLM Proposes, Code Decides"

Most AI planners fail because they let the LLM do arithmetic and invent imaginary vendors. In Jashn:

- **Gemini 2.5** proposes structured celebration creative tasks and non-negotiables via schema-constrained generation with 1-shot repair retry.
- **Pure tested TypeScript** computes every date, critical path, budget allocation, and risk alert.
- **Post-Parse Guardrails** reject any model hallucination containing URLs, phone numbers, or corporate vendor names. Real vendors come only from Google Places.

---

### ⚙️ Engineering Discipline & Verified Metrics

Built with test-driven rigor inside **Google Antigravity**:

- **Tests**: 215+ passing unit, integration, and UI tests across 37 test suites.
- **Code Coverage**: 100% line coverage and 97.4% branch coverage in `src/lib`.
- **GenAI Evals (ADLC)**: 15/15 offline deterministic scenarios passing with zero drift.
- **Traceability**: 30/30 acceptance criteria (`AC1` to `AC30`) fully traced and verified.
- **Performance**: First Load JS is just **117 kB** (well under the 170 kB budget).
- **Accessibility**: 100% automated `vitest-axe` WCAG 2.1 AA pass (0 violations) across all screens and dual-mode SVG canvas / vertical timeline list.
- **Code Quality**: Zero ESLint warnings, zero Knip dead code, zero circular imports, functions $\le 40$ lines.

---

### 🎨 AI Art Disclosure

Cover art and empty-state illustrations were generated at build-time using Google Flow (Imagen) via `flow_assets.py` and committed with inline SVG vector fallbacks to guarantee zero runtime build dependencies.

---

### 🚫 Deliberate Non-Goals

1. **No Autonomous Messaging**: The app never sends messages autonomously; all contact actions generate validated `tel:` and `wa.me` links for a human to review and send.
2. **No In-App Payments**: Celebrations in India rely on relationship-based advances; Jashn tracks quotes and spend without handling financial transactions.

---

🔗 **Live Cloud Run App**: https://jashn-planner-asia-south1.run.app  
💻 **GitHub Repository**: https://github.com/your-org/jashn

Huge thanks to Google for Developers and Hack2skill for hosting PromptWars!

#PromptWars #GoogleForDevelopers #Hack2skill #BuildWithAI #Gemini #GoogleCloud #WebDev #TypeScript #NextJS
