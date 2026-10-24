---
trigger: model_decision
description: "Apply when working on vendor search, Places, geocoding, the map, contact actions or vendor status."
---
# Maps and vendors
- Vendors come only from Places API (New) through server routes. Use buildQueries, buildSearchBody,
  normalisePlacesResponse, rankVendors, contact helpers and status helpers from src/lib/vendors.
- Lean search field mask; contact fields only via details, only on open or shortlist. Check current docs for fields and tiers.
- Persist only placeId + need + status + quote + note (VendorSelection). Never persist names, ratings, addresses or phones.
- Show Google attribution. Dependencies for the map load lazily. Map failure falls back to list + Maps deep links.
- WhatsApp only for mobile numbers. First message from buildEnquiry (en/hi/pa). The human sends; the app never does.
- Degrade gracefully (AC27): no key or quota -> Maps search link and manual vendor entry.
