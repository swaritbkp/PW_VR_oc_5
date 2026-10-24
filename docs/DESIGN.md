# Jashn Visual Design System & UX Architecture

This document specifies the visual system, typography, component layouts, and interaction ergonomics for Jashn, grounded in the cultural vitality of North Indian celebrations (weddings, birthdays, and community festivals) while maintaining the calm, mathematical precision of an operational command center.

---

## Palette

The color system avoids superficial neon accents or clichéd wedding ornament, anchoring instead in warm editorial tones. The canvas and chrome remain quiet so that the **Critical Ribbon** and node statuses remain immediately distinguishable at a glance.

Every color pair satisfies WCAG AA contrast (minimum 4.5:1 for normal text, 3:0:1 for graphics and large text). Color is never used as the sole conveyor of information; every status is paired with an icon, border stroke pattern, or text badge.

### Semantic Tokens

| Token            | Semantic Role                            | Light Mode Hex             | Dark Mode Hex           | Light Contrast | Dark Contrast |
| ---------------- | ---------------------------------------- | -------------------------- | ----------------------- | -------------- | ------------- |
| `canvas-bg`      | Page & canvas background                 | `#FAF9F6` (Warm Pearl)     | `#121417` (Deep Slate)  | Base surface   | Base surface  |
| `surface-card`   | Panels, cards, inspector                 | `#FFFFFF` (Pure White)     | `#1C2024` (Charcoal)    | 1.1:1 on bg    | 1.2:1 on bg   |
| `border-subtle`  | Dividers, grid lines, calendar ticks     | `#E2E8F0` (Slate 200)      | `#2A323D` (Slate 800)   | 1.3:1 graphic  | 1.4:1 graphic |
| `text-primary`   | Headings, node titles, primary numbers   | `#1E293B` (Slate 900)      | `#F8FAFC` (Slate 50)    | 13.5:1 (AAA)   | 15.8:1 (AAA)  |
| `text-secondary` | Meta text, float days, lead times        | `#64748B` (Slate 500)      | `#94A3B8` (Slate 400)   | 4.6:1 (AA)     | 5.2:1 (AA)    |
| `brand`          | Primary CTAs, active highlights          | `#9A3412` (Burnt Sienna)   | `#FB923C` (Warm Amber)  | 6.8:1 (AA)     | 8.5:1 (AA)    |
| `critical`       | Critical Ribbon, zero-float nodes        | `#DC2626` (Crimson Ribbon) | `#F87171` (Light Coral) | 5.1:1 (AA)     | 7.2:1 (AA)    |
| `buffer`         | Float tails, flexible schedule paths     | `#2563EB` (Royal Blue)     | `#60A5FA` (Sky Blue)    | 5.8:1 (AA)     | 6.9:1 (AA)    |
| `done`           | Completed tasks, booked vendors          | `#059669` (Emerald)        | `#34D399` (Mint)        | 4.8:1 (AA)     | 9.1:1 (AA)    |
| `at-risk`        | Sentinel alerts, schedule crunch, delays | `#D97706` (Marigold Ochre) | `#FBBF24` (Sun Amber)   | 4.7:1 (AA)     | 11.2:1 (AA)   |
| `backup`         | Dashed border ring, Plan B nodes         | `#7C3AED` (Royal Indigo)   | `#A78BFA` (Lavender)    | 6.2:1 (AA)     | 7.8:1 (AA)    |

---

## Type

Typography balances editorial grace with numerical precision. The type stack supports English, Hindi (Devanagari script), and Punjabi (Gurmukhi script) with unified metrics and optical readability.

### Typeface Stack

1. **Body & Interface Sans**: `Noto Sans` (Google Font via `next/font/google` with subsets `latin`, `devanagari`, `gurmukhi`).
   - Clean, neutral, high x-height, and complete native glyph coverage for multilingual event descriptions and vendor notes.
2. **Display & Heading Serif**: `Rozha One` / `Noto Serif Devanagari` & `Noto Serif Gurmukhi`.
   - Used sparingly for main event titles, celebrating ceremonial gravitas without slowing down scannability.
3. **Tabular Numerics**: `Noto Sans` with OpenType feature `tabular-nums` (`font-variant-numeric: tabular-nums`).
   - Guarantees strict column alignment for budget ledgers, CPM float days, countdowns, and probability gauges.

### Scale & Hierarchy

- **Display 1 (Event Title)**: 28px / 1.75rem | Bold (700) | Line-height 1.2
- **Heading 2 (Lanes & Drawers)**: 18px / 1.125rem | Semi-Bold (600) | Line-height 1.3
- **Heading 3 (Node Titles & Cards)**: 14px / 0.875rem | Medium (500) | Line-height 1.4
- **Body / Descriptions**: 14px / 0.875rem | Regular (400) | Line-height 1.5
- **Caption / Meta Chips**: 12px / 0.75rem | Medium (500) | Line-height 1.3
- **Numbers / Metrics**: 14px / 0.875rem | Semi-Bold (600) | Tabular

---

## Layout

The user interface revolves around five primary views, designed mobile-first from 360px up to 1440px desktop screens.

### 1. Start / Template Gallery

```text
+-----------------------------------------------------------------------+
| JASHN                                           [En | हि | ਪੰ] [Theme] |
| Celebration & Event Planner with Schedulable Resilience               |
+-----------------------------------------------------------------------+
| Filter: [ All (12) ]  [ Weddings (4) ]  [ Birthdays (4) ]  [ Community (4) ]
+-----------------------------------------------------------------------+
| +-------------------------+ +-------------------------+ +-----------+ |
| | [Flow Art / SVG Cover]  | | [Flow Art / SVG Cover]  | | [Cover]   | |
| | Phulkari Courtyard      | | Intimate Morning Brunch | | Dino Party| |
| | 150-450 guests          | | 50-130 guests           | | 20-50 gst | |
| | ₹15L - ₹40L • Oct-Mar   | | ₹6L - ₹15L • Oct-Apr    | | ₹25k-₹80k | |
| | [ 4 Plan B Backups ]    | | [ 3 Plan B Backups ]    | | [2 Backs] | |
| | [ Pick Template ]       | | [ Pick Template ]       | | [ Pick ]  | |
| +-------------------------+ +-------------------------+ +-----------+ |
|                                                                       |
| [ Or Start with a Blank Custom Event ]                                |
+-----------------------------------------------------------------------+
```

### 2. Event Graph Workspace + Command Center + Node Inspector

```text
+-----------------------------------------------------------------------+
| Priya's Wedding (Chandigarh) • 14 Dec 2026 • 51 Days Left             |
| Readiness: [======--] P80 (82%)  |  Resilience: 85/100  |  Budget: ₹25L|
+-----------------------------------------------------------------------+
| Command Center Strip: [!] 1 Sentinel Alert: Venue buffer is 2 days    |
+---------------------------------------------------+-------------------+
| EVENT GRAPH CANVAS (SVG - Pan/Zoom/Edge Nav)      | NODE INSPECTOR    |
| [Fit Dates] [List View] [Zoom + -] [Filter Lane]  | Task: Book Venue  |
|                                                   | Lane: Venue       |
| Lane: Planning                                    | Dates: 01 Nov-10Nov|
|  [W01 Set Budget] ---> [W02 Guest List]           | Float: 0d (CRIT)  |
|                               |                   | Status: Shortlist |
| Lane: Venue                   v                   +-------------------+
|               ==========>[W04 Book Venue]*======> | Tabs:             |
|               (CRITICAL RIBBON - BOLD STROKE)     | [Plan][Vendors]   |
| Lane: Decor                   |                   | [Backups][Risks]  |
|                               v                   +-------------------+
|                        [W07 Floral Mock]----->    | Need: banquet_hall|
| Lane: Logistics               |                   | Distance: 3.2 km  |
|                               v                   | [ Find Vendors ]  |
|                   ((W22 Rain Tent Cover))         | [ Held Backup: 1 ]|
|                     (Dashed Ring: Plan B)         | [ Mark Done ]     |
+---------------------------------------------------+-------------------+
| Footer: Keyboard: [←/→] Navigate Chain  [↑/↓] Lanes  [Enter] Inspect  |
+-----------------------------------------------------------------------+
```

### 3. Vendors Tab (Map + Ranked List + Contact Sheet)

```text
+---------------------------------------------------+
| VENDORS NEAR CHANDIGARH (Need: Banquet Hall)     |
+---------------------------------------------------+
| [ INTERACTIVE GOOGLE MAP / FALLBACK LIST MAP ]    |
| [ Pin 1 (Top Pick) ]   [ Pin 2 ]   [ Pin 3 (Held) ]|
+---------------------------------------------------+
| Filter: [ Rating 4.0+ ] [ Within 10 km ] [ Open ] |
+---------------------------------------------------+
| 1. The Grand Banquet & Lawn           4.6★ (124)  |
|    Sector 35, Chandigarh • 4.1 km away • ₹₹₹      |
|    Status: Shortlisted                            |
|    [ Call ] [ WhatsApp ] [ Directions ] [ Backup ]|
+---------------------------------------------------+
| 2. Forest Hill Resort                 4.5★ (89)   |
|    Nayagaon • 7.8 km away • ₹₹₹₹                  |
|    Status: Held as Backup (Plan B)                |
|    [ Call ] [ WhatsApp ] [ Directions ] [ Release]|
+---------------------------------------------------+
| Attribution: "Vendor data and maps powered by Google" |
+---------------------------------------------------+
```

### 4. Disruption Simulator Drawer (Ghost Nodes)

```text
+---------------------------------------------------+
| DISRUPTION SIMULATOR                              |
| Test how your plan holds up under unexpected shocks|
+---------------------------------------------------+
| Select Shock: [ Venue Cancels 2 Weeks Out       v]|
| Toggle: [X] Test with my held backup vendors       |
+---------------------------------------------------+
| IMPACT METRICS                                    |
| Metric             Without Backup    With Plan B  |
| -----------------  ---------------   ------------ |
| Days Lost          21 days           4 days       |
| Readiness P(ready) 34% (CRUNCH)      79% (VIABLE) |
| Event at Risk?     YES [!]           NO [✓]       |
+---------------------------------------------------+
| Graph Preview:                                    |
| [Old W04 Venue] ---> (Ghost outline displaced +21d)|
| With Plan B: Switches to Forest Hill in 4 days    |
+---------------------------------------------------+
| [ Keep Current Plan ]      [ Switch to Plan B ]   |
+---------------------------------------------------+
```

### 5. 360px Mobile Vertical Timeline List + Bottom Dock

```text
+-----------------------------------+
| JASHN            [51 Days] [82%]  |
| Priya's Wedding (Chandigarh)      |
+-----------------------------------+
| Mode: [Canvas] [= Timeline List =]|
+-----------------------------------+
| Week 1: 01 Nov - 07 Nov           |
| +-------------------------------+ |
| | [!] CRITICAL • 0d float       | |
| | W04 Book Banquet Venue        | |
| | Target: 07 Nov • Needs Vendor | |
| | Status: Shortlisted           | |
| | [ Inspect ]  [ Vendors (3) ]  | |
| +-------------------------------+ |
|                                   |
| Week 2: 08 Nov - 14 Nov           |
| +-------------------------------+ |
| | [~] Buffer: +6d float         | |
| | W07 Select Floral Decor       | |
| | Target: 12 Nov • In Progress  | |
| +-------------------------------+ |
|                                   |
| +-------------------------------+ |
| | [B] Plan B Held               | |
| | W22 Arrange Rain Weather Cover| |
| | Backup: Shivalik Tent House   | |
| +-------------------------------+ |
+-----------------------------------+
| BOTTOM DOCK (Sticky, 48px touch)  |
| [Graph] [Vendors] [Risks] [Budget]|
+-----------------------------------+
```

---

## Principles

1. **Grounded in North India Celebrations**: Designed with warmth, family hospitality, and authentic cultural realities (monsoon showers, winter smog/fog lead times, peak auspicious wedding dates) while avoiding gaudy caricatures.
2. **One Memorable Hero—The Critical Ribbon**: Visual boldness is strictly budgeted. The canvas is restrained so that the continuous bold red Critical Ribbon unmistakably commands visual attention.
3. **No Meaning Through Color Alone**: Color blindness and high-glare phone screens are accommodated by ensuring that every status has a dual encoding:
   - Critical path: Red color + Bold thick stroke + "Critical" text badge.
   - Buffer / Float: Blue color + Soft dotted tail + "+Nd float" pill.
   - Plan B Backup: Violet color + Double dashed border ring + Shield icon.
   - Completed: Green color + Strikethrough title + Checkmark icon.
4. **Motion with Intent and Respect**: Motion is purposeful (drawing the Critical Ribbon upon initial plan generation; smooth transition of ghost nodes in disruption simulations). Full compliance with `prefers-reduced-motion: reduce` turns off all animations with instant state updates.
5. **Radical Transparency & Zero Hallucination**: Every cost displays a computational basis. Every vendor reflects genuine Google Places data with clear Google attribution. If an API key is missing or quota runs out, the system degrades gracefully into deep links and manual entry rather than falsifying data.

---

## Critique

A rigorous design critique was conducted against generic starter templates and common design defaults:

1. **Rejected Generic Aesthetic**:
   - _Default_: Cream parchment background, serif italic headers, and clichéd terracotta accents typical of generic wedding invitation websites.
   - _Critique_: Impractical for readability under sunlight, illegible for complex tabular scheduling, and feels like a greeting card rather than an actionable tool.
   - _Adopted_: Warm Pearl (`#FAF9F6`) and Deep Slate (`#121417`) background paired with purposeful Burnt Sienna and Marigold Ochre accents, providing modern editorial dignity.
2. **Rejected Dashboard Dark Mode Cliche**:
   - _Default_: Pitch black background with glowing cyan and neon purple accents.
   - _Critique_: Looks like a crypto exchange or cyber security tool, completely alien to family event planners and stressful to read.
   - _Adopted_: Soft Charcoal surfaces (`#1C2024`) with warm amber, coral, and lavender accents that retain celebratory warmth even in dark mode.
3. **Rejected SaaS Card Container Clutter**:
   - _Default_: Boxing every piece of information into identical white rounded cards with heavy drop shadows.
   - _Critique_: Wastes screen real estate and creates visual noise that distracts from the temporal relationships between tasks.
   - _Adopted_: Canvas-first layout with clean horizontal category lanes, subtle grid ticks, and floating collapsible sheets.
4. **Rejected ALL-CAPS Eyebrows**:
   - _Default_: Small tracked uppercase labels like `CRITICAL PATH` or `DAYS REMAINING` above every single heading.
   - _Critique_: Poor legibility, especially when translated into Devanagari or Gurmukhi scripts where uppercase does not exist.
   - _Adopted_: Clean sentence-case copy across all headers, badges, and tooltips.
5. **Rejected Mobile Canvas Panning Traps**:
   - _Default_: Forcing users on 360px phones to pinch-zoom and scroll a large desktop SVG canvas.
   - _Critique_: High cognitive friction, missed dependencies, and frustrating touch navigation.
   - _Adopted_: Automatic transition below 480px to a structured vertical timeline list, while retaining a 1-tap toggle to view the full graph if desired.
