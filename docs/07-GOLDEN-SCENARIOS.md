# Golden scenarios (each becomes a test or an eval)

1. Punjabi wedding, Chandigarh, 300 guests, INR 25,00,000, 7 months out (template phulkari courtyard).
2. Kid's birthday, Ludhiana, 40 guests, INR 40,000, 14 days out (template dino explorer).
3. RWA Lohri, Mohali, 150 guests, INR 60,000, 3 weeks out (template Lohri bonfire).
4. Impossible budget (500 guests, INR 50,000): explicit over/under gap, never a fake fit.
5. Date in the past or today: validation error. Tomorrow: crunch mode with shortfall and compress options.
6. Guests 0, -5, 999999, "abc": validation errors, no model call.
7. What-if guests 300 -> 400: only guest-driven nodes change; undo restores a byte-identical plan.
8. What-if budget -30% with live dhol locked: locked line untouched; trade-offs name what was cut.
9. Venue booking slips 10 days: critical path recomputed, diff lists affected nodes, Sentinel raises alerts.
10. Non-critical task slips within float: critical path unchanged, float shrinks, no critical alert.
11. Date pulled forward three weeks: buffer negative, R3 fires, P(ready) drops, calendar updates.
12. Hostile notes (injection, script tags, 10k chars, RTL text): no leak, no render break.
13. Hindi and Punjabi plan language: text in that language, numbers still computed by code.
14. Malformed model JSON twice: retry UI, no partial plan. Rate limit: 429 + Retry-After.
15. All tasks complete: next-best-action shows the celebratory empty state; alerts empty.
16. Template gallery: each of the 12 templates builds a valid graph with one event-day sink (AC18).
17. Venue node selected for Chandigarh: search runs for "wedding venue in Chandigarh" within the radius, returns
    ranked vendors on map and list; the LLM adds no vendor facts (AC20, AC21).
18. Places key missing or quota exceeded: Maps deep-link search and manual vendor entry appear (AC27).
19. Shortlist -> contacted -> quoted -> booked: booking task starts then completes, graph shows the diff (AC23).
20. Landline number: Call works, WhatsApp button hidden. Mobile: WhatsApp opens with the prefilled message (AC22).
21. Hold a second venue as Backup: R6 clears for venue, resilience score rises (AC24).
22. Simulate "venue cancels" with and without a backup: days lost 21 vs 4 (seed values), event-at-risk flag correct (AC25).
23. Outdoor wedding in August: R7 monsoon warning and rain risk ranked first; indoor event hides it (AC26).
24. December wedding in Chandigarh: booking lead times stretched by the peak multiplier; R7 peak and fog info (AC26).
25. Flow assets absent: gallery uses CSS/SVG art; flow_assets.py check passes non-strict (AC28).
26. Keyboard-only run through the graph: arrows follow edges, Enter opens inspector, Escape closes (AC29).
27. Reload the app: localStorage holds only placeId and user fields for vendors; names and ratings are refetched (AC30).
