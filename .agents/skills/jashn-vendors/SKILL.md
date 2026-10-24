---
name: jashn-vendors
description: Builds vendor discovery: Places server routes, ranked map and list, select and contact, status pipeline, backups. Use for milestone M4.
---

# Vendors (M4)

Read docs/09 and ref-vendor-places; check current Places and Maps JS docs via the Google Developer Knowledge MCP.
Build: /api/geo, /api/vendors/search, /api/vendors/details (zod, rate limit, typed errors), server cache, VendorMap (lazy), VendorList,
VendorCard, ContactSheet (call, WhatsApp, directions, website, copy, backup, reject), quote entry, status -> plan updates via applyVendorStatus,
fallbacks (Maps deep link, manual entry), attribution, storage of VendorSelection only. Use a fake Places client with fixtures in tests.
Tests: AC20 to AC24, AC27, AC30.
