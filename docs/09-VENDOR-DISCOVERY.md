# Vendor discovery: location-aware search, map, select and contact

Pure parts (seeded, tested): src/lib/vendors/{needs,places,rank,contact,status}.ts. The agent builds the server
routes and UI around them. Check current Google docs with the Google Developer Knowledge MCP before coding.

## Flow
Node with vendorNeed selected -> client calls /api/vendors/search {need, eventType, city, center, radius} ->
server builds queries (buildQueries) -> Places API (New) Text Search with locationBias circle around the event
centre (buildSearchBody) -> normalisePlacesResponse -> rankVendors -> client shows map + list.

## Event centre
/api/geo resolves a city or locality to lat/lng (Places text search, location only) and returns it. A "Use my
location" button is optional and permission-based. The centre is part of the plan; the user can drag a pin.

## Routes
POST /api/vendors/search   rate limited, zod-validated, server key, lean field mask, <= 2 queries per need.
GET  /api/vendors/details  place id -> phone, website, maps link (details mask), called only when a vendor is
                           opened or shortlisted.
Both return typed errors with a code (NO_KEY, QUOTA, UPSTREAM, BAD_INPUT) the UI maps to friendly states.

## Keys
Server key: GOOGLE_PLACES_API_KEY (Secret Manager), restricted to the Places API. Browser key:
NEXT_PUBLIC_MAPS_BROWSER_KEY, restricted by HTTP referrer and to the Maps JavaScript API only, with a quota cap.
Never reuse one key for both. Never log keys or full responses.

## Cost and terms
Field mask kept lean; contact fields fetched lazily; short in-memory server cache (minutes) only; one search per
need per open; debounce; cap results at 12. Respect Maps Platform terms: show Google attribution, show Places data
with a Google map or attribution, and do not store place content beyond the place id (AC30). Re-verify caching and
display terms in current docs before shipping.

## Select and contact
Shortlist, Call (tel:), WhatsApp (wa.me link, mobile numbers only, message prefilled by buildEnquiry in en/hi/pa),
Directions (Maps URL), Website, Copy message, Set as backup, Reject. The app never sends anything: the user taps,
their phone does the rest. Quote entry (INR) on Quoted feeds the budget actuals.
Status pipeline: shortlisted -> contacted -> quoted -> booked, plus backup and rejected (canTransition).
Booked completes the booking task and the graph shows the diff; contacted or quoted starts it.

## Ranking
Bayesian average rating (few reviews shrink toward 4.0) minus a small distance penalty; optional max price level
from the budget band. Explain the order in the UI ("rated by 312 people, 2.4 km away").

## Fallbacks (AC27)
No key, quota exceeded or offline: show "Search on Google Maps" (mapsSearchUrl, no key needed), manual vendor entry
(name, phone), and the checklist questions. Never fake a vendor.

## LLM boundary
The Advisor may add "questions to ask" and "what to compare" for a need using only the fields in the result.
It may not invent vendors, phones, prices or reviews. Guardrails reject new URLs, phones and company names.

## Testing
Fake Places client with recorded JSON fixtures; tests for query building, clamping, normalisation, ranking,
contact links, status transitions, graceful degradation and the "no persisted place content" rule.
