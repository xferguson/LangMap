# Backlog — out-of-scope items

Owned by **product-designer**. Format: `- [YYYY-MM-DD] item — reason`.

- [2026-04-30] Authoritative speaker-overlap deduplication — cross-tabulated bilingualism data is not publicly available; v1 acknowledges naïve summing via a tooltip.
- [2026-04-30] Exhaustive sub-national coverage of every minority language — v1 ships a curated dataset focused on major languages plus a hand-picked set of regional ones.
- [2026-04-30] Sharing / exporting / publishing the user's map — v1 is a private local tool; no backend.
- [2026-04-30] Multiple profiles or accounts — single implicit profile in localStorage for v1.
- [2026-04-30] Dark mode and theming — single light theme for v1; trivial to add later.
- [2026-04-30] Mobile-optimized layout — v1 targets desktop browsers; the map and dual-thumb slider need responsive work that isn't in scope.
- [2026-04-30] In-app editing of the language/region dataset — dataset is code-only in v1; user edits would need data validation and a settings UI.
- [2026-04-30] Historical, extinct, or constructed languages — v1 covers living languages only.
- [2026-04-30] Per-skill (Reading/Speaking/Listening/Writing) level breakdowns — v1 uses a single overall CEFR level per language.
- [2026-04-30] Responsive layout below 1280px wide — v1.1 single-panel constraint is specified at desktop only; narrower viewports need a separate pass.
- [2026-04-30] Light/dark map theme toggle — v1.1 switches the base land color to white as the single new default rather than offering a toggle.
- [2026-05-01] Responsive layout below 1024×768 — v1.3 panel layout pins desktop floor at 1024×768; sub-1024 viewports need a separate responsive pass (collapsible panel, stacked layout, etc.).
- [2026-05-01] Re-add Antarctica as a proper polygon if v1.3 drops it — if ADR 0004 chooses to exclude Antarctica rather than split it, a future increment should restore it once the antimeridian/projection cleanup pipeline can handle its geometry without rendering as a horizontal band.
- [2026-05-01] Restore antimeridian-crossing countries cleanly — if v1.3 chooses to filter Russia/Fiji/NZ wrap rings rather than split them, a future increment should add proper antimeridian splitting so the full polygons render without the stripe artifact.
- [2026-05-01] Dataset expansion past 139 languages toward 250 — deferred from v1.2's stretch target; v1.3 freezes at 139 and v1.4 does not touch the dataset.
- [2026-05-01] Light/dark theme toggle for the side panel — v1.4 keeps the v1.3 dark panel and only polishes the filter section within it; a toggle remains out of scope.
- [2026-05-01] Per-thumb numeric/CEFR readout component for the level filter — v1.4 specifies legibility and contrast for the labels and thumbs but does not pin down a specific readout pattern (tooltip vs. inline label vs. value pill); future polish can standardize this across other slider-style controls if any are added.
