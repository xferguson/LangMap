# Language Map v1 — Manual verification checklist

Run after `npm test` and `npm run e2e` are green. The orchestrator may give you a
preview browser; if not, return `BLOCKED — needs human` for any step requiring
visual judgment.

## Setup

1. `npm install` (one-time).
2. `npm run dev` and open the printed URL in a desktop browser.
3. In DevTools, run `localStorage.clear()` then refresh, so you start clean.

## Steps

1. **Empty state.** The page loads without errors. Map renders. Language list
   is empty. Stats show 0 countries / 0.0% in both cards. Slider sits at A1 ↔
   Native.

2. **Add Spanish — B2.** Type "Spanish" in the picker, choose level B2, click
   Add. A row "Spanish — B2" appears. Spain (and other Spanish-speaking
   countries) fill at a moderate translucent shade — eyeball check: looks like
   ~55% opacity, distinctly lighter than Native at 75%.

3. **Add English — A2 and French — C1.** Confirm Canada renders at the C1
   shade (single fill, no double-darkening). Confirm GB renders at the A2 shade
   (very light). Confirm FR renders at the C1 shade.

4. **Catalan-only check.** Remove all languages. Add "Catalan" at B2. Confirm
   Catalonia, Balearic Islands, and Valencia fill while the rest of Spain stays
   unfilled. Andorra also fills.

5. **Filter range.** With English-A2 and Spanish-Native present, drag the
   slider's min thumb to B1. English's regions should disappear from the map
   while Spanish's regions remain. Drag min back to A1 — English returns. Now
   set max to A2 — Spanish disappears, English remains.

6. **Stats independence.** Confirm that during step 5, the Communicate (B1+)
   and Get by (A1+) cards' numbers do **not** change as you drag the slider.

7. **Population tooltip.** Hover the ⓘ next to either population %. A tooltip
   appears within ~200ms and contains language about overlap / bilingual
   speakers not being deduplicated. Move the mouse away — tooltip disappears.

8. **Reload persistence.** With two languages present and the filter set to
   B1↔C2, reload the page (F5). The two languages and filter range come back
   without any user action.

## Visual checks (automation can't cover)

- The seven opacity steps look monotonically darker from A1 → C2/Native.
  Eyeball test: A1 is very faint (≈15%), C1/C2/Native look almost
  fully-saturated.
- Sub-national regions sit on top of country paths cleanly — no z-order
  glitches, no double-fill where a country has a sub-national region but the
  country isn't itself covered (e.g. ES with only Catalan should not show any
  Spain fill bleeding through CT/IB/VC).
- Hover tooltip is positioned near the cursor, doesn't get clipped by the
  panel edges, and has readable contrast.

## data-testid contract

The implementer must wire these test IDs onto the listed elements. Tests will
not pass without them.

### `<App />` root layout

- `world-map` — outer container of `<WorldMap />`
- `side-panel` — the single right-hand `<aside>` housing the language picker,
  language list, stats panel, and level-range slider (v1.1)

### `<WorldMap />`

- For every rendered region path, attribute `data-region="<RegionRef>"` (e.g.
  `data-region="ES"`, `data-region="ES-CT"`, `data-region="CA"`). Under v1.2
  these attributes are attached to the SVG layer elements via Leaflet's
  `onEachFeature` hook, not via React JSX.
- Each region path's fill-opacity comes from `coverageMap`. In v1.1, regions
  with no coverage omitted `fill-opacity` entirely. Under v1.2 (Leaflet's
  imperative `setStyle`) regions with no coverage may carry `fill-opacity="0"`
  instead — both forms are accepted by tests.
- `map-coverage-state` — a hidden `<div data-testid="map-coverage-state"
  data-coverage="<JSON>">` next to the map, where `<JSON>` is
  `JSON.stringify([...coverageMap(state)])`. Lets unit/e2e tests assert
  region-opacity pairs without waiting for tile network or polygon paint.

### `<LanguagePicker />` (v1.1 — dropdown row)

- `language-picker-language` — `<select>` listing every language. Each
  `<option>`'s `value` is the language id (e.g. `"spa"`), and visible text is
  the language display name. Options are sorted alphabetically by display name
  (case-insensitive).
- `language-picker-level` — `<select>` of levels (option values `A1` … `Native`)
- `language-picker-add` — submit button

(Removed in v1.1: `language-picker-search` and `language-option-<id>`. The
picker is now a `<select>` row, not a search-and-click flow.)

### `<LanguageList />`

- `language-row-<id>` — one per user language (e.g. `language-row-spa`),
  containing the visible name + level
- `language-row-remove-<id>` — the remove button on that row

### `<App />` v1.3 panel sections

- `panel-section-add` — wraps `<LanguagePicker />`, first section in the side panel.
- `panel-section-list` — wraps `<LanguageList />`, the only flex-grow / scrollable region of the panel grid.
- `panel-section-stats` — wraps `<StatsPanel />`.
- `panel-section-filter` — wraps `<LevelRangeSlider />`, last section in the side panel.

The four sections appear in the listed DOM order inside `data-testid="side-panel"` and each carries an `<h2>` title ("Add a language", "Your languages", "Stats", "Filter by level").

### `<App />` v1.5 mobile drawer

- `drawer-toggle` — hamburger button (`☰`) that opens the drawer on mobile.
  Always rendered; CSS hides it at desktop. Carries `aria-expanded="false"|"true"`
  and `aria-label="Open menu"|"Close menu"` reflecting drawer state.
- `drawer-overlay` — dim backdrop covering the map while the drawer is open
  on mobile. Always rendered; carries `data-state="open"|"closed"`. Tapping
  it closes the drawer.
- `drawer-close` — `×` button rendered as the first child of `<aside>`,
  visible only on mobile, closes the drawer when clicked.

`side-panel` and `drawer-overlay` carry `data-state="open"|"closed"` reflecting
the current drawer state. The drawer-toggle button carries
`aria-expanded="true"|"false"`. On desktop the same DOM nodes exist but the
drawer-toggle, drawer-close, and drawer-overlay are hidden via CSS
(`display: none`) and the side panel sits in its v1.4 left-column position.

### `<StatsPanel />`

- `stats-communicate` — Communicate (B1+) card root
- `stats-communicate-count` — element whose text is the country count
- `stats-communicate-pop` — element whose text is the population %
  (formatted with one decimal, e.g. `"7.3%"`)
- `stats-communicate-info` — the ⓘ icon that triggers the tooltip
- `stats-communicate-tooltip` — the tooltip that appears on hover, containing
  text matching `/overlap|bilingual|deduplicate/i`
- `stats-getby` — Get by (A1+) card root
- `stats-getby-count` — country count
- `stats-getby-pop` — population %

### `<LevelRangeSlider />`

- `level-range-slider` — root element with attributes `data-min` and `data-max`
  reflecting the current value (so tests can read state without driving an
  rc-slider drag in jsdom)
- `level-range-thumb-min` — the `rc-slider` min thumb element. Focusable; tests
  drive it with ArrowLeft / ArrowRight to change the min value.
- `level-range-thumb-max` — the `rc-slider` max thumb element. Same focus +
  arrow-key contract as the min thumb.
- `level-range-readout` — a small `<div>` above the slider whose text content
  matches `/Showing\s+<min>\s+to\s+<max>/i` (e.g. "Showing A1 to Native").
  Updates live as the user drags or arrow-keys a thumb.

(v1.4 retired `level-range-min` and `level-range-max` — the two fallback
`<select>` elements that carried those testids were removed in favor of
keyboard-driven `rc-slider` thumbs. The `onChange({ min, max })` contract is
unchanged.)

## v1.1 visual checks

Run after the v1.1 implementation lands. These need a human eye and a 1280x800
desktop viewport.

1. **No spurious geometry (v1.1-1).** Open the app at empty state. Look at
   West Africa near 0deg longitude. There must be no triangle-shaped or
   stray-line artifacts; only real country outlines (Ghana, Togo, Benin,
   Nigeria, Burkina Faso, etc.) and Western Sahara should render. Add Russian
   or Persian (when present in dataset) and confirm Azerbaijan highlights.

2. **Single-pane layout at 1280x800 (v1.1-2, v1.1-3).** Resize the browser
   viewport to exactly 1280x800. Confirm:
   - The map fills the main left area; one side panel sits on the right.
   - The side panel contains, top-to-bottom: language picker row, language
     list, stats cards, level-range slider.
   - With up to 8 languages added, neither the page nor the side panel needs
     scrolling to see the map, all controls, and both stats cards.

3. **White map with blue highlights (v1.1-7, v1.1-8).** Empty state: every
   country renders white with light gray borders, clearly visible against the
   dark page background. Add "English - A1" (the lightest opacity, 0.15);
   confirm English-speaking countries are still visibly tinted blue against
   the white base — country borders remain visible at every defined opacity
   level.

4. **Dropdown picker (v1.1-4, v1.1-5).** Click the language `<select>`. The
   dropdown lists every available language exactly once, sorted alphabetically
   by display name (case-insensitive). The level `<select>` and **Add** button
   sit on the same horizontal row to the right of it, with no separate search
   input visible.

## v1.2 visual checks

Run after the v1.2 implementation lands. These need a human eye and a desktop
viewport ≥ 1024×768.

1. **Tile basemap loads (v1.2-1).** The map area renders a recognizable
   real-world map: oceans, continents, country borders, low-chroma greys/very
   pale beige tile background. Confirm the basemap is not a flat color or a
   broken-tile checkerboard.

2. **Pan and zoom (v1.2-5).** Drag the map with the mouse — the view pans
   smoothly. Use the scroll wheel or pinch — the view zooms. Add a language
   first; pan/zoom and confirm the highlights stay attached to their countries
   (no flicker, no drift, opacities preserved).

3. **Side panel on the left (v1.2-2).** At ≥ 1024×768, the side panel sits on
   the left edge of the viewport with the map filling the area to its right.
   Panel width unchanged from v1.1 (~360px).

4. **Tile attribution visible (v1.2-8).** At the bottom-right corner of the
   map, the text "© OpenStreetMap contributors © CARTO" is visible. It is
   not hidden by CSS or covered by other UI.

5. **Picker shows 100+ languages with type-ahead (v1.2-3).** Open the language
   `<select>`. The list contains at least 100 entries (target 250), sorted
   alphabetically. Type "sw" — the dropdown jumps to Swahili (or Swedish,
   depending on first match). Type-ahead works because it's a native `<select>`.

6. **No page scroll at 1024×768 (v1.2-9).** Resize the viewport to exactly
   1024×768. Add up to 8 languages. Neither vertical nor horizontal page-level
   scrollbars appear. The side panel may still scroll internally if its
   content overflows.

7. **No busy labels fight the blue overlay.** The CartoDB Positron tiles have
   minimal in-tile text. With Spanish-Native added, the blue ES fill at 0.75
   opacity is the dominant color over Spain — tile labels (city names,
   country names) stay readable but don't compete for attention.

## v1.3 visual checks

Run after the v1.3 implementation lands. These need a human eye and a desktop
viewport ≥ 1024×768.

1. **No antimeridian artifacts (v1.3-1).** Open the app at empty state, default
   zoom. Scan the map left-to-right top-to-bottom. There must be no horizontal
   stripe spanning the full map width at any latitude. Russia, Fiji, and New
   Zealand each render as proper polygons (or are simply not present in the
   dataset). No "thin band" geometry at any latitude.

2. **No West Africa stray vertical line (v1.3-2).** Pan to West Africa near 0°
   longitude. Confirm no thin north-south line cuts through the region outside
   the legitimate Algerian / Mauritanian / Moroccan / Western Sahara borders.
   The Western Sahara disputed boundary is allowed; stray slivers are not.

3. **Antarctica handling (v1.3-3).** Inspect the southern edge of the map.
   Either Antarctica is absent (the ADR 0004 chosen path) — confirm no AQ
   polygon paints — or Antarctica renders as a real, recognizable polygon
   (not as a horizontal band). Either outcome passes.

4. **Side panel sectioning + dividers (v1.3-6).** Open DevTools, inspect the
   side panel. Confirm four labeled sections in this order:
   - "Add a language" (`panel-section-add`)
   - "Your languages" (`panel-section-list`)
   - "Stats" (`panel-section-stats`)
   - "Filter by level" (`panel-section-filter`)
   Visually confirm each section header is rendered (uppercase, smaller font,
   muted color) and a thin divider sits above each section after the first.

5. **No scroll bars on the panel (v1.3-4) at 1024×768 with 8 languages.**
   Resize the browser to exactly 1024×768. Add 8 languages from the dropdown.
   Confirm:
   - The side panel does not show a horizontal or vertical scrollbar.
   - The page does not scroll either (v1.3-5 retained from v1.2-9).
   - The picker, stats, and filter sections all sit visibly within the
     panel.

6. **Side-by-side stats cards (Decision 4 of ADR 0004).** Confirm the
   Communicate (B1+) and Get by (A1+) cards sit side by side (two columns),
   not stacked.

7. **Internal-only list scroll (v1.3-7).** With the 1024×768 viewport, add 12
   languages. Confirm only the language-list region shows an internal scroll
   bar while the picker, stats, and filter sections remain visible without
   scrolling the panel itself.

8. **Long-name no-wrap + ellipsis (v1.3-8).** Add "Scottish Gaelic" or any
   other long-name language. Its row stays on a single line, the level
   badge and the **Remove** button remain on the same row, and any name
   that exceeds the available width truncates with a CSS ellipsis (no
   wrapping to a second line).

## v1.4 visual checks

Run after the v1.4 implementation lands. These need a human eye and a desktop
viewport ≥ 1024×768.

1. **Uncovered countries are transparent over the basemap (v1.4-1).** Open
   the app at empty state. Every country should render with the CartoDB
   Positron tiles fully visible through it — no country should appear blue,
   grey, or any non-zero opacity overlay. Only after adding a language do
   the matching countries paint blue at the configured opacity ramp; all
   other countries remain transparent.

2. **No horizontal stripes or bars at any latitude (v1.4-2, v1.4-4).** Scan
   the map left-to-right at empty state and again with 3 languages added.
   There must be no horizontal stripe along the southern edge (Antarctica
   is gone), no horizontal bars across northern latitudes, and no west-Africa
   triangle slivers near 0° longitude.

3. **No spurious sliver geometry anywhere (v1.4-3).** Pan around the map.
   No triangle-shaped, stripe-shaped, or sliver paths appear anywhere
   (West Africa / prime meridian / antimeridian). Fiji is gone (expected;
   FJ is dropped from the dataset). Russia's far-east tip (Chukotka) is
   gone (expected; clipped per ADR 0005).

4. **Filter section is visually crisp (v1.4-5).** Open the side panel.
   Confirm:
   - The "Filter by level" section heading is present.
   - The seven CEFR tick labels A1, A2, B1, B2, C1, C2, Native are
     rendered along/under the slider, evenly spaced, legible against the
     dark panel, and don't overlap each other at the panel's 360px width.
   - The two slider thumbs are at least 16×16 px, visually distinct from
     the track, and easy to grab with a mouse.
   - The active range segment between the two thumbs is rendered in a
     contrasting accent color (the existing `--accent` blue) against both
     the inactive track and the panel background.
   - A "Showing {min} to {max}" readout (e.g. "Showing A1 to Native")
     appears above the slider and updates live as you drag a thumb.

## v1.5 mobile checks

Run after the v1.5 implementation lands. These need a human eye and DevTools
device emulation. Reset state with `localStorage.clear()` between checks.

1. **iPhone 14 (390×844) drawer flow.** Open DevTools, set the device to
   "iPhone 14" (or set responsive mode to 390×844). Reload. Confirm:
   - The map fills the entire viewport. The side panel is not visible.
   - A hamburger button (`☰`) sits at the top-left of the map area, clear
     of the device's notch / status bar.
   - Tap the hamburger. The drawer slides in from the left smoothly (≤ 300
     ms, no flicker). A dim overlay covers the map.
   - Tap anywhere on the overlay. The drawer slides back out cleanly.
   - Tap the hamburger again, then tap the `×` close button inside the
     drawer. The drawer closes.
   - Tap the hamburger again, then press the hardware/keyboard Escape. The
     drawer closes.

2. **iPad portrait (768×1024).** Set the DevTools device to "iPad" in
   portrait orientation. Confirm the mobile drawer pattern is still active
   (hamburger visible, side panel hidden by default, overlay covers the map
   when open). 768 px is the upper bound of the mobile breakpoint.

3. **iPad landscape (1024×768).** Rotate the iPad device to landscape.
   Confirm the desktop layout is restored: side panel pinned on the left at
   360 px wide, no hamburger button visible, no overlay, map fills the
   remaining space to the right.

4. **Notched device clearance (iPhone 14 Pro).** Set the DevTools device to
   "iPhone 14 Pro" (or any profile with a notch + home indicator). Confirm:
   - The hamburger toggle clears the notch — the button does not sit under
     the status bar / camera cutout.
   - The Leaflet attribution control "© OpenStreetMap contributors © CARTO"
     remains visible at the bottom-right of the map and is not clipped or
     overlapped by the home indicator safe area.

5. **Touch target spot check (any mobile viewport).** Open the drawer.
   Eyeball + measure (DevTools "Inspect" reports the box):
   - Slider thumbs (`level-range-thumb-min`, `level-range-thumb-max`) are
     ≥ 24×24 px.
   - Per-language-row remove buttons (`language-row-remove-<id>`) are
     ≥ 32×32 px.
   - Language `<select>`, level `<select>`, and **Add** button are each
     ≥ 36 px tall.

6. **Drawer contents parity (v1.5-5).** With the drawer open on mobile,
   confirm the same four sections appear in the same DOM order as the
   desktop side panel: "Add a language", "Your languages", "Stats", "Filter
   by level". All controls inside (picker, list, stats cards, filter
   slider) work exactly as on desktop.
