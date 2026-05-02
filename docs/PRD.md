# Language Map — PRD

This file is owned by the **product-designer** agent. Do not edit by hand.

Sections will be appended as features are designed in the build cycle.

---

## v1 — Personal Language Map (2026-04-30)

### Goal

A single-page web app that lets a user list the languages they speak with CEFR levels and immediately see which countries and sub-national regions they can understand, with map opacity scaled by proficiency and live coverage stats.

### User-visible behavior

1. The page shows a world map (countries plus selected sub-national regions), a sidebar to manage languages, a stats panel, and a level-range filter.
2. The user picks a language from a searchable list and assigns a CEFR level: **A1, A2, B1, B2, C1, C2, or Native**.
3. Adding a language fills every country/region where it is official **or** widely spoken (de facto), with fill opacity determined by the user's level for that language.
4. Opacity scale: A1 = 15%, A2 = 25%, B1 = 40%, B2 = 55%, C1 = 70%, C2 = 75%, Native = 75%.
5. If two of the user's languages cover the same region, the region is filled at the **higher** of the two opacities (no additive blending).
6. Sub-national regions (e.g. Catalonia, Quebec, Wales) highlight independently — adding a regional language does **not** fill its parent country; only the explicitly listed regions.
7. The stats panel shows two cards:
   - **Communicate (B1+):** count of distinct countries covered by the user's B1+ languages, plus a "% of world population" figure.
   - **Get by (A1+):** same, but for A1+ languages.
8. The "% of world population" figure is computed as `sum(L1+L2 speakers of qualifying languages) / world population`. A small "ⓘ" tooltip on the stat notes that overlap (bilingual speakers) is not deduplicated.
9. A two-thumb level-range filter (A1 ↔ Native, default A1↔Native) hides regions whose contributing language(s) fall outside the range. The stats panel cards are **not** affected by the filter — they always reflect their own thresholds (B1+ and A1+).
10. Each row in the language list has a remove control. Removing a language updates the map and stats immediately.
11. The user's languages and filter state persist across page reloads via `localStorage`.

### Acceptance criteria

1. **Add a language with a level.** Given an empty app, when the user picks "Spanish" and level "B2" and clicks Add, then "Spanish — B2" appears in the language list and every region tagged for Spanish is filled at 55% opacity.
2. **Opacity scaling by level.** Given the user has added the same language at each of the seven levels in separate sessions, when the map renders, then the regions fill at exactly {A1: 0.15, A2: 0.25, B1: 0.40, B2: 0.55, C1: 0.70, C2: 0.75, Native: 0.75}.
3. **Max-opacity dedup on overlap.** Given the user adds "English — A2" and "French — C1", when both languages cover Canada, then Canada renders at 0.70 (C1) opacity, not 0.85 or any sum.
4. **Sub-national regions do not bleed into parent country.** Given the user adds only "Catalan — B2" (and no Spanish), when the map renders, then Catalonia, Balearic Islands, and Valencia fill at 0.55 but the rest of Spain remains unfilled.
5. **Sub-national region under a parent language.** Given the user adds only "Spanish — Native", when the map renders, then all of Spain (including Catalonia, Balearics, Valencia as part of the country fill) is filled at 0.75 — the country-level entry covers the whole country.
6. **Communicate (B1+) country count.** Given the user has Spanish-Native, English-A2, and Catalan-B2, when the stats render, then the "Communicate (B1+)" card counts every distinct country covered by Spanish or Catalan and excludes any country covered only by English.
7. **Communicate (B1+) population percentage.** Given the same state as criterion 6, when the stats render, then the population % equals `(SpanishL1 + SpanishL2 + CatalanL1 + CatalanL2) / WORLD_POPULATION`, formatted as a percentage with one decimal place.
8. **Get by (A1+) is a strict superset.** Given any non-empty language list, when the stats render, then the "Get by (A1+)" country count is greater than or equal to the "Communicate (B1+)" country count, and the same holds for the population %.
9. **Population overlap tooltip is present.** Given the stats panel is visible, when the user hovers the "ⓘ" icon next to either population %, then a tooltip appears stating that the figure does not deduplicate bilingual speakers.
10. **Level range filter hides regions below the min.** Given the user has English-A2 and Spanish-Native, when the user sets the filter min to B1, then English's regions are no longer filled on the map but Spanish's regions remain at 0.75.
11. **Level range filter hides regions above the max.** Given the user has English-A2 and Spanish-Native, when the user sets the filter max to A2, then Spanish's regions are no longer filled but English's are.
12. **Filter does not affect stats cards.** Given any user state and any filter range, when the filter changes, then the "Communicate (B1+)" and "Get by (A1+)" card values do not change.
13. **Remove a language.** Given the user has "Spanish — Native" in the list, when the user clicks remove on that row, then the row disappears and every region that was filled solely by Spanish becomes unfilled, and stats update accordingly.
14. **localStorage persistence on reload.** Given the user has added two languages and adjusted the filter to B1↔C2, when the user reloads the page, then the same two languages and the same filter range are restored without any user action.
15. **localStorage hydration is fault-tolerant.** Given a corrupted or schema-mismatched value in `localStorage` under the app's key, when the page loads, then the app starts with default empty state instead of crashing.
16. **Duplicate-language guard.** Given the user has "Spanish — B1" in the list, when the user adds "Spanish" again at level "C1", then the existing row's level is updated to C1 (no second row is created).

### Non-goals (v1)

The following are explicitly out of scope for v1 and have been added to `BACKLOG.md`:

- Authoritative speaker-overlap deduplication (acknowledged inline via tooltip).
- Exhaustive sub-national coverage of every minority language worldwide — v1 ships a curated dataset.
- Sharing, exporting, or publishing the user's map.
- Multiple profiles or accounts.
- Dark mode and theming.
- Mobile-optimized layout (v1 targets desktop browsers).
- Editing or contributing to the underlying language/region dataset from the UI.
- Historical/extinct languages or constructed languages.
- Per-skill breakdowns (separate Reading / Speaking / Listening / Writing levels).

---

## v1.1 — UX polish and West Africa bugfix (2026-04-30)

### Goal

A UX polish + bugfix increment that consolidates controls into a single side panel, replaces the searchable language picker with two adjacent dropdowns, lightens the base map for better contrast, and removes spurious geometry rendering across West Africa.

### User-visible behavior changes

1. The map no longer shows stray triangles or any geometry that does not correspond to a real country or curated sub-national region (the West Africa artifacts near 0° longitude are gone).
2. The page is a single-pane layout: the map fills the main content area, and **all** language management and filter controls live in one side panel — no separate stats area floating elsewhere, no need to scroll at desktop sizes.
3. Adding a language is done with a language `<select>` dropdown and a level `<select>` dropdown sitting side-by-side, with the **Add** button immediately to their right on the same row. The previous search-then-click flow is gone.
4. Countries with no coverage render with a **white** fill instead of the dark `--land` color from v1, so the blue user-language highlights stand out more clearly.

### Acceptance criteria

1. **v1.1-1 — No spurious geometry on the map.** Given the app loads with any user state (including empty), when the rendered SVG is inspected, then every `<path>` element corresponds to a known region key in the curated dataset (a valid country code, ISO 3166-1 / M49 entry, or a listed sub-national region id) and no orphan paths exist; specifically, no triangle-shaped or unmatched paths render across West Africa near 0° longitude.
2. **v1.1-2 — Single side panel houses all controls.** Given a desktop viewport of at least 1280×800, when the page renders, then the map occupies the main content area and a single side panel contains the language list, the add-language controls, the stats cards, and the level-range filter — no other control surfaces are visible elsewhere on the page.
3. **v1.1-3 — No scrolling at desktop viewport.** Given a viewport of exactly 1280×800, when the user has up to 8 languages added, then neither the page nor the side panel requires scrolling to see the map, all controls, and both stats cards.
4. **v1.1-4 — Add-language row layout.** Given the side panel is visible, when the user looks at the add-language area, then a language `<select>`, a level `<select>`, and an **Add** button appear on the same horizontal row in that order, with no separate search input present.
5. **v1.1-5 — Language dropdown is alphabetical and complete.** Given the language `<select>` is opened, when the options render, then every available language in the dataset is listed exactly once, sorted alphabetically by display name (case-insensitive).
6. **v1.1-6 — Duplicate-language guard preserved through new picker.** Given the user already has "Spanish — B1" in the list, when the user picks "Spanish" + "C1" in the new dropdowns and clicks **Add**, then the existing Spanish row's level updates to C1 and no second row is created (v1 AC 16 still holds via the new control).
7. **v1.1-7 — Country fill is white for uncovered regions.** Given a country has no language coverage from the user's current list and filter, when the map renders, then that country's `fill` resolves to white (`#ffffff` or equivalent), not the v1 dark land color.
8. **v1.1-8 — Highlight color stays a distinguishable blue on white.** Given any country is highlighted because of a user language, when the map renders against the new white base, then the highlight fill is a blue hue with sufficient contrast to remain visually distinct from the white background at every defined opacity level (A1 0.15 through Native 0.75).

### Non-goals (v1.1)

- No changes to the underlying language/region dataset semantics, opacity scale, stats math, or persistence behavior — those remain as specified in v1.
- No mobile or sub-1280-wide responsive layout work; the single-panel constraint is specified at desktop only.
- No theming controls; the lighter map is the single new default, not a toggle.

---

## v1.2 — Real-map renderer + 250-language dataset (2026-05-01)

### Goal

Swap the bare D3-rendered SVG map for a Leaflet-backed tile map so the page reads as a real map, expand the language dataset from the v1.1 seed of 10 to a target of 250 (floor 100) — guaranteeing that every language officially or de-facto recognized in any country is selectable — and move the side panel from the right edge to the left for layout polish. All v1 + v1.1 user-facing behavior is preserved.

### User-visible behavior changes

1. The map renders against a low-chroma tile background (CartoDB Positron) with country borders visible, so the user sees actual geography (continents, oceans, country shapes in context) rather than disconnected polygons. Highlighting still uses blue with the same opacity ramp.
2. The user can **pan and zoom** the map with mouse / scroll / pinch / Leaflet's default controls, and region highlighting persists through pan/zoom.
3. The side panel is now on the **left** of the viewport. The map fills the area to its right.
4. The language picker `<select>` lists at least 100 languages (target 250). The list is alphabetical and includes every language that is the official or recognized language of any country represented in the dataset.
5. Tile attribution ("© OpenStreetMap contributors © CARTO") is visible at the corner of the map per provider terms.

### Acceptance criteria

1. **v1.2-1 — Tile-backed map renders.** Given the page loads, when the map area renders, then a Leaflet container is mounted, tiles load from `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` (subdomains `a` `b` `c` `d`), and the user sees a recognizable world map (oceans, continents, country borders) at the default zoom.
2. **v1.2-2 — Side panel is on the left.** Given a desktop viewport ≥ 1024×768, when the layout renders, then the side panel sits at the left edge of the viewport with its width unchanged from v1.1 (360px) and the map fills the rest of the horizontal space to its right.
3. **v1.2-3 — Dataset has at least 100 languages.** Given the language `<select>` opens, when its options enumerate, then at least 100 distinct languages are selectable (target 250); every option's value is a valid `Language.id` from `src/data/languages.ts` and every entry has non-empty `name`, non-zero `speakers.l1 + speakers.l2`, and at least one `RegionRef` in `regions`.
4. **v1.2-4 — Must-include enforcement.** Given the official-language enumeration for any country represented in the country GeoJSON dataset, when the build runs, then every `(country, language)` pair from that enumeration appears in the dataset (`country` is a member of that language's `regions`, OR documented as an exception in `src/data/must-include-exceptions.ts`). A failing pair causes the build to fail.
5. **v1.2-5 — Pan and zoom preserve highlighting.** Given the user has any non-empty language list, when the user pans or zooms the map, then every country/region polygon retains its v1 / v1.1 fill opacity exactly as `coverageMap(state)` returned it (no re-fetch, no flicker, no opacity drift).
6. **v1.2-6 — Sub-national polygons paint above country polygons.** Given the user adds only "Catalan — B2" (no Spanish), when the map renders, then Catalonia, Balearic Islands, and Valencia paint at 0.55 fill opacity over the underlying Spain polygon, and the underlying Spain polygon's fill opacity is 0 (transparent), so visually only those three sub-national regions appear blue and the rest of Spain shows the tile basemap. (v1 AC 4 preserved through Leaflet's pane stacking.)
7. **v1.2-7 — v1 + v1.1 acceptance criteria continue to hold.** Given the v1.2 build is deployed, when each of v1 AC 1–16 and v1.1 AC 1.1-1, 1.1-2, 1.1-4, 1.1-5, 1.1-6, 1.1-7, 1.1-8 is exercised, then it passes with the same observable outcome. (1.1-3's exact 1280×800 pin is replaced by 1.2-9 below.)
8. **v1.2-8 — Tile attribution visible.** Given the map is rendered, when the user looks at the bottom-right corner of the map area, then the attribution string "© OpenStreetMap contributors © CARTO" is visible (Leaflet's default attribution control, not hidden by CSS).
9. **v1.2-9 — No page-level scroll at desktop sizes.** Given a desktop viewport ≥ 1024×768, when the user has up to 8 languages added, then `document.documentElement.scrollHeight ≤ window.innerHeight` and `scrollWidth ≤ window.innerWidth`. (Replaces v1.1-3's exact 1280×800 pin with a softer ≥1024×768 floor; the side panel may still scroll internally if its content overflows, but the page itself does not.)
10. **v1.2-10 — Persistence backward-compat.** Given a user upgrades from v1.1 to v1.2 with a populated `localStorage` key `langmap.v1`, when the v1.2 page first loads, then their saved languages and filter range are restored unchanged. The schema, key, and hydrate semantics are identical to v1.1.

### Non-goals (v1.2)

- No mobile or responsive layout below 1024×768.
- No custom tile design or alternative tile providers in the UI (tile choice is fixed at build time).
- No search input or custom combobox replacing the `<select>` — browser type-ahead on `<select>` is the only picker affordance.
- No UI for adding, editing, or contributing to the language dataset (still curated in `src/data/languages.ts`).
- No language-density heatmap, no per-region speaker counts in the tooltip, no continent/region grouping in the picker.
- No tile caching for offline use; an internet connection is required to load the basemap.
- No admin-1 polygon coverage for every regional language on Earth — the curated subset grows from ~7 to ~80 entries; gaps log a build-time warning rather than failing.

---

## v1.3 — Map artifacts cleanup + side panel polish (2026-05-01)

### Goal

A v1.3 polish increment that eliminates spurious lines from the world map (so every visible boundary corresponds to a real country, sub-national, or disputed-territory border) and rebuilds the left side panel with clear sectioning, consistent typography, and a layout that fits the viewport at desktop sizes (≥ 1024×768) without panel-level or page-level scroll bars when the user has up to 8 languages.

### User-visible behavior changes

1. The map no longer shows horizontal stripes spanning the full width, north-south stray lines through West Africa, or thin "bridge" connectors between disjoint territories. Russia, Fiji, New Zealand, Antarctica, and Western Sahara either render as proper polygons or are excluded per the ADR.
2. The side panel is reorganized into four labeled sections — **Add a language**, **Your languages**, **Stats**, **Filter by level** — each with consistent spacing and a visible divider, so the visual hierarchy is obvious at a glance.
3. The side panel itself does not scroll at desktop sizes with up to 8 languages. The language list is the only region inside the panel that scrolls (and only when its content actually overflows); the picker, stats, and filter remain pinned and visible.
4. Long language names (up to 30 characters) fit on a single language-row line at the panel's 360px width, with the level badge and remove button on the same row; truly long names truncate with an ellipsis rather than wrapping.

### Acceptance criteria

1. **v1.3-1 — No antimeridian artifacts.** Given the page loads, when the map is inspected at the default zoom, then no rendered GeoJSON polygon spans the full width of the map area as a thin stripe (no rendered path's bounding box has `width ≥ 90% of map width AND height < 5px`). Russia, Fiji, and New Zealand are either properly split at the antimeridian or excluded from the rendered country dataset.

2. **v1.3-2 — No spurious West Africa lines.** Given the map renders, when the prime-meridian and Western Sahara region are inspected, then no path renders a thin north-south line outside of the legitimate Algerian / Mauritanian / Moroccan / Western Sahara borders. The disputed Western Sahara boundary is allowed to display per the dataset; "stray" sliver geometries are not.

3. **v1.3-3 — Antarctica handling.** Given the map renders, when the southern edge of the projection is inspected, then either Antarctica renders as a proper polygon (not a horizontal band stretching across the full map width) **or** Antarctica is excluded from the rendered country dataset. The choice between split-vs-exclude is owned by the tech-lead in ADR 0004.

4. **v1.3-4 — Panel has no scroll bar.** Given a desktop viewport ≥ 1024×768 with up to 8 languages added, when the side panel is inspected, then `panel.scrollWidth ≤ panel.clientWidth` and `panel.scrollHeight ≤ panel.clientHeight` (the panel itself displays neither a horizontal nor a vertical scroll bar).

5. **v1.3-5 — Page has no page-level scroll.** Given a desktop viewport ≥ 1024×768 with up to 8 languages added, when the page renders, then `document.documentElement.scrollHeight ≤ window.innerHeight` and `scrollWidth ≤ window.innerWidth`. (Retained from v1.2-9.)

6. **v1.3-6 — Section structure and dividers.** Given the side panel is open, when its DOM is inspected, then it contains exactly four labeled sections in this order — "Add a language", "Your languages", "Stats", "Filter by level" — each carrying a stable `data-testid`: `panel-section-add`, `panel-section-list`, `panel-section-stats`, `panel-section-filter`.

7. **v1.3-7 — Language list scrolls internally if needed.** Given the user has added 12 or more languages, when the panel renders, then only the language-list region scrolls (its `overflow-y` is `auto` and it is the flex-grow row of the panel grid); the add-language picker, stats cards, and level filter remain visible without scrolling the panel itself.

8. **v1.3-8 — Typography no overflow.** Given any language whose display name is up to 30 characters, when its row renders at the panel's 360px width, then the row does not wrap to a second line and the level badge plus remove control remain on the same row without overlapping the name. Names longer than the available width truncate with a CSS ellipsis rather than wrapping.

9. **v1.3-9 — All v1, v1.1, v1.2 ACs continue to hold.** Given the v1.3 build is deployed, when each prior acceptance criterion is exercised — opacity ramp, max-opacity dedup, sub-national semantics, stats math, filter independence, duplicate-language guard, persistence, dropdown picker, white base land, tile-backed map, left-side panel, ≥100-language dataset, must-include enforcement, pan/zoom, sub-national pane stacking, attribution, and storage backward-compat — then each passes with the same observable outcome.

### Non-goals (v1.3)

- No new languages added to the dataset (still 139; expansion remains a v1.4+ task).
- No mobile or responsive layout below 1024×768.
- No theming controls or dark mode.
- No new map interactions (drawing, drag-to-add, hover popups, etc.).
- No re-projection to a non-Mercator basemap.

---

## v1.4 — Map regression fixes + filter section polish (2026-05-01)

### Goal

A regression-fix increment that restores the v1.2 map quality (transparent country polygons over the tile basemap, no spurious sliver geometry, no horizontal stripes/bars across latitude rows) which v1.3 broke, and tightens the visual polish of the **Filter by level** section in the side panel so the level-range slider reads as a deliberate, legible control rather than a janky default.

### User-visible behavior changes

1. Uncovered countries no longer render as solid blue. They render with `fill-opacity: 0` so the tile basemap shows through, exactly as in v1.2; only countries (and sub-national regions) covered by the user's languages render blue, at the configured opacity ramp. The contrast between covered and uncovered countries is obvious at a glance.
2. The map shows no horizontal stripe or bar of color across any latitude row. The southern (Antarctica-related) horizontal line, the West Africa sliver triangles, and the northern horizontal "lines/bars" are all gone, regardless of whether the user has any languages selected.
3. The **Filter by level** section is restyled: the slider has clear `Min` and `Max` end labels (or equivalent visual affordance), the seven CEFR tick labels (A1, A2, B1, B2, C1, C2, Native) are evenly spaced, legible against the dark panel, and do not crowd or overlap; the slider thumbs are sized so they're easy to grab and clearly indicate the current min/max selection; the filled segment between the thumbs uses a hue that contrasts with both the inactive track and the panel background.

### Acceptance criteria

1. **v1.4-1 — Uncovered countries are transparent over the basemap.** Given the user has any language list (including empty), when the map renders, then every country polygon that is **not** covered by a currently active user language has `fill-opacity: 0` (the tile basemap is fully visible through it) and only covered countries/regions render with a blue fill at the v1 opacity ramp; specifically, no country polygon paints a default blue, grey, or any non-zero-opacity overlay when it is uncovered.

2. **v1.4-2 — No horizontal stripe across the southern edge.** Given the page loads at default zoom, when the rendered SVG/Canvas overlay is inspected, then no rendered geometry produces a horizontal stripe along the southern edge of the map (no rendered polygon's bounding box has `width ≥ 75% of map width AND height < 8px` anywhere south of latitude −55°), whether Antarctica is split into proper polygons or excluded from the dataset.

3. **v1.4-3 — No spurious sliver geometry anywhere on the map.** Given the page loads at default zoom, when the map is inspected (with and without any language selected), then no triangle-shaped, stripe-shaped, or otherwise-spurious slivers render outside legitimate country / sub-national / disputed-territory borders — including but not limited to the West Africa region near 0° longitude, the prime meridian, and the antimeridian. Every rendered path corresponds to a known region key in the dataset (re-asserts v1.1-1 and v1.3-2 with the additional constraint that the spurious geometry must not appear filled in blue either).

4. **v1.4-4 — No horizontal bars of color across any latitude row.** Given the page loads at default zoom with any user state, when the rendered map is inspected, then no rectangular bar of color (covered or uncovered fill) spans more than 75% of the map width at a height of less than 8px at any latitude — north, south, or equatorial. The constraint is a strict superset of v1.3-1 and v1.4-2 covering the northern bars the user reported.

5. **v1.4-5 — Filter-by-level section is visually crisp.** Given the side panel is open at desktop sizes (≥ 1024×768), when the **Filter by level** section is inspected, then: (a) the section has a clear heading ("Filter by level") matching the v1.3 sectioning style, (b) the seven CEFR tick labels A1, A2, B1, B2, C1, C2, Native are rendered along/under the slider, evenly spaced, legible against the panel's dark background (contrast ratio ≥ 4.5:1 against the section background), and do not visually overlap each other at the panel's 360px width, (c) the two slider thumbs are at least 16×16 px, visually distinguishable from the track, and clearly indicate the current min/max selection (e.g. via label, tooltip, or visible numeric/CEFR readout), and (d) the active range segment between the two thumbs is rendered in a color that contrasts with the inactive track segments and with the panel background.

### Non-goals (v1.4)

- No changes to the language dataset, opacity ramp, stats math, persistence schema, or sub-national semantics — those remain as specified in v1, v1.1, v1.2, v1.3.
- No mobile or responsive layout below 1024×768.
- No theming controls or dark/light toggle; v1.4 keeps the v1.3 panel theme and only restyles the filter section within it.
- No new map interactions (hover popups, click-to-toggle, etc.).
- No re-projection or change of tile provider.
- No expansion past 139 languages — that backlog item still rolls forward.

---

## v1.5 — Mobile-friendly layout + touch-target sizing (2026-05-02)

### Goal

A responsive layout increment that makes the app usable on phones and small tablets. At viewports ≤ 768 px the side panel becomes a slide-in drawer toggled by a hamburger button, the map fills the viewport, and touch targets across the app (slider thumbs, remove buttons, selects, primary buttons) bump up to thumb-friendly sizes at every viewport. The desktop layout (≥ 769 px) is functionally unchanged from v1.4.

### User-visible behavior changes

1. On viewports ≤ 768 px wide, the page opens with the map filling the screen and the side panel hidden. A hamburger button at the top-left of the map area toggles a drawer that slides in from the left containing the same four sections as the desktop side panel.
2. While the drawer is open on mobile, a dim overlay covers the map and tapping the overlay (or pressing Escape) closes the drawer.
3. At viewports ≥ 769 px, the layout is identical to v1.4 — panel on the left, map on the right, no hamburger button, no overlay.
4. Touch targets are larger across the entire app at every viewport: the level-range slider thumbs, the per-language-row remove control, the language and level `<select>` dropdowns, and the **Add** button are all easier to tap with a thumb than in v1.4.
5. On notched mobile devices the Leaflet attribution control remains visible and clears the device's home-indicator safe area; the app shell uses `100dvh` so iOS Safari's collapsing URL bar does not leave the user with a clipped layout.

### Acceptance criteria

1. **v1.5-1 — Mobile layout hides the panel and fills the map.** Given a viewport ≤ 768 px wide, when the page first loads, then the side panel is hidden by default (not visible to the user) and the map area fills the full viewport width and full visible height.

2. **v1.5-2 — Drawer toggle visibility is breakpoint-driven.** Given the page is rendered, when the viewport width is ≤ 768 px, then an element with `data-testid="drawer-toggle"` is visible in the top-left of the map area; when the viewport width is ≥ 769 px, then that same element is either absent from the rendered DOM or has computed `display: none` so the user does not see it.

3. **v1.5-3 — Tapping the toggle opens the drawer with a transition.** Given a viewport ≤ 768 px and the drawer is closed, when the user taps the element with `data-testid="drawer-toggle"`, then the side panel slides in from the left via a CSS transition whose total duration is ≤ 300 ms and the drawer reaches its open state at the end of that transition.

4. **v1.5-4 — Overlay covers the map and dismisses the drawer.** Given a viewport ≤ 768 px and the drawer is open, when the rendered DOM is inspected, then an element with `data-testid="drawer-overlay"` covers the visible map area; when the user taps that overlay, then the drawer closes.

5. **v1.5-5 — Drawer contents match desktop sections and order.** Given a viewport ≤ 768 px and the drawer is open, when its contents are inspected, then it contains exactly the same four sections as the desktop side panel — `panel-section-add`, `panel-section-list`, `panel-section-stats`, `panel-section-filter` — in that order, with no functional differences from the desktop panel (same controls, same behavior, same data-testids).

6. **v1.5-6 — Desktop layout is unchanged from v1.4.** Given a viewport ≥ 769 px, when the layout renders, then no `drawer-toggle` and no `drawer-overlay` are visible to the user, the side panel sits at the left edge with its v1.2 360 px width, the map fills the rest of the horizontal space to its right, and the rendered layout matches v1.4 byte-for-byte.

7. **v1.5-7 — Touch targets meet minimum sizes at every viewport.** Given the page is rendered at any viewport, when controls are inspected, then the level-range slider thumbs are ≥ 24×24 px, the per-language-row remove button is ≥ 32×32 px, and the language `<select>`, level `<select>`, and **Add** button are each ≥ 36 px tall.

8. **v1.5-8 — Leaflet attribution is visible and clears safe-area on mobile.** Given a viewport ≤ 768 px on a notched-device profile (e.g. iPhone 14 Pro in DevTools), when the map renders, then the Leaflet attribution control "© OpenStreetMap contributors © CARTO" is visible and is not clipped, hidden, or overlapped by the device's home-indicator safe area.

9. **v1.5-9 — All prior ACs continue to hold at desktop test viewport.** Given the v1.5 build is deployed and tests run at the existing desktop viewport of 1280×800, when each acceptance criterion from v1, v1.1, v1.2, v1.3, and v1.4 is exercised, then it passes with the same observable outcome it had in v1.4.

### Non-goals (v1.5)

- No bottom-sheet pattern — the user explicitly chose the drawer-from-left pattern; a bottom-sheet variant is not in scope.
- No full ARIA dialog focus management — v1.5 uses a minimal focus trap (focus the close control on open, restore on close) only; complete `role="dialog"` modal semantics, focus cycling, and inert-background handling are deferred.
- No persistence of drawer-open state across reloads — the drawer always defaults to closed when the page loads on mobile.
- No reorientation of the language list to a horizontal chip strip on mobile — the list remains a vertical column inside the drawer with the same row layout as desktop.
- No changes to the dataset, opacity ramp, stats math, persistence schema, or sub-national semantics — those remain as specified in v1 through v1.4.
- No theming controls or dark/light toggle.
- No new map interactions on mobile (e.g. tap-and-hold popups, long-press to add language).
