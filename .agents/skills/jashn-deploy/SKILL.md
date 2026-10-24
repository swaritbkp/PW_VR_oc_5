---
name: jashn-deploy
description: Deploys Jashn to Cloud Run and smoke-tests the live URL. Use after M0 (hello world) and again at the end.
---
# Deploy
npm run build locally. `gcloud run deploy jashn --source . --region asia-south1 --allow-unauthenticated` with GEMINI_API_KEY and
GOOGLE_PLACES_API_KEY from Secret Manager, NEXT_PUBLIC_MAPS_BROWSER_KEY as a build-time value (restricted key). Smoke test the LIVE URL:
/api/health, golden 1-3, one vendor search, one disruption simulation, one what-if with undo. Write docs/DEPLOY.md with the https URL
and the word smoke plus results.
