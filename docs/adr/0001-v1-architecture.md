# ADR 0001: v1 Architecture

## Status: Accepted

## Context

v1 ships a single-page React app where the user adds CEFR-graded languages and sees a world map fill with opacity-scaled coverage plus live stats (16 acceptance criteria in `docs/PRD.md`). The tech stack is locked in `CLAUDE.md`. We need to fix the data model, projection, persistence shape, and the sub-national strategy before TDD begins.

## Decision

1. **Data model** matches the approved plan: `Level`, `RegionRef` (ISO 3166-1 alpha-2 or 3166-2), `Language { id, name, endonym?, speakers:{l1,l2}, regions[] }`, `UserLanguage`, `AppState { languages, filter:{min,max} }`. Single source of truth in `src/types.ts`.
2. **Libraries**: `d3-geo` (`geoNaturalEarth1`) + `topojson-client` for projection; React renders SVG paths; `rc-slider` for the dual-thumb level filter. No state library — `useState` + a small persistence hook.
3. **Projection**: Natural Earth I — readable for a static world view.
4. **Persistence**: `localStorage` key `langmap.v1`, JSON-serialized `AppState`, hydrated on mount inside try/catch with a shape guard; corrupt or schema-mismatched data falls back to defaults (AC 15).
5. **Sub-national approach**: regions are explicit ISO 3166-2 entries on a language (`cat` → `["ES-CT","ES-IB","ES-VC","AD"]`). A country code on a language fills the whole country (Spain at Native covers Catalonia visually via the country path). Sub-national paths render only for codes referenced in the dataset. v1 ships a hand-authored `admin1-subset.json` with three features: `ES-CT`, `ES-IB`, `ES-VC` — no 5MB Natural Earth fetch.
6. **Stats are filter-independent** (AC 12): `lib/stats.ts` reads `state.languages` directly; `lib/coverage.ts` is the only consumer of the filter range.

## Consequences

- Adding regional languages later means appending features to `admin1-subset.json` — documented but cheap.
- Population % naively sums L1+L2 across qualifying languages; the `ⓘ` tooltip in `StatsPanel` discloses this (AC 9).
- `WORLD_POPULATION` is a constant (`8.1e9`) in `lib/stats.ts`.

## Task list

Tasks are ordered so QA can write tests for task N before task N+1 begins. Each task lists files, the tests that drive it, and a reuse pointer.

1. **Define types** — `src/types.ts`: `Level`, `RegionRef`, `Language`, `UserLanguage`, `AppState`. Tests: type-only; QA writes a `tests/unit/types.test-d.ts` (or inline assertion test) that imports each name. Reuse: none. Covers: foundation for AC 1–16.

2. **Levels & opacity** — `src/lib/levels.ts`: `LEVEL_ORDER`, `LEVEL_OPACITY`, `COMMUNICATE_THRESHOLD`, `GETBY_THRESHOLD`, `levelAtLeast(a,b)`, `levelInRange(l, min, max)`. Tests: `tests/unit/levels.test.ts` — exact opacity values per AC 2, ordering, range inclusivity at endpoints. Reuse: none. Covers: AC 2, supports AC 6/8/10/11.

3. **Seed dataset** — `src/data/languages.ts`: ~10 entries — Spanish (`spa`, regions `["ES","MX","AR","CO",…]`), English (`eng`, many countries inc. `CA`, `US`, `GB`), French (`fra`, inc. `CA`, `FR`, `BE`), Catalan (`cat`, regions `["ES-CT","ES-IB","ES-VC","AD"]`), German, Portuguese, Italian, Mandarin, Arabic, Japanese. Speaker counts in absolute numbers with a one-line cite per entry. Tests: `tests/unit/languages.test.ts` — every `regions[]` entry matches `^[A-Z]{2}(-[A-Z0-9]{1,3})?$`, no duplicate ids, Catalan has only sub-national + Andorra (no `ES`). Reuse: none. Covers: AC 1, 4, 5.

4. **Admin-1 subset** — `src/data/admin1-subset.json`: hand-authored TopoJSON with three features keyed by ISO 3166-2 (`ES-CT`, `ES-IB`, `ES-VC`). Tests: `tests/unit/admin1-subset.test.ts` — JSON parses, contains exactly the three codes, each has a `geometry`. Reuse: none. Covers: AC 4.

5. **Coverage** — `src/lib/coverage.ts`: `coverageFor(state, region) -> number | null` and `coverageMap(state) -> Map<RegionRef, number>`. Applies filter range, sub-national codes do **not** auto-fill parent country, max-opacity dedup. Tests: `tests/unit/coverage.test.ts` — AC 3 (English-A2 + French-C1 over CA → 0.70), AC 4 (Catalan-only → CT/IB/VC filled, ES unfilled), AC 5 (Spanish-Native → ES filled, sub-national entries not separately listed), AC 10 + 11 (filter excludes). Reuse: `lib/levels.ts` from task 2. Covers: AC 3, 4, 5, 10, 11.

6. **Stats** — `src/lib/stats.ts`: `WORLD_POPULATION`, `countriesAtOrAbove(state, level)` (sub-national rolls up to country), `populationAtOrAbove(state, level)` (returns ratio). Ignores filter. Tests: `tests/unit/stats.test.ts` — AC 6 (B1+ excludes English-A2), AC 7 (exact ratio formula), AC 8 (A1+ ≥ B1+), AC 12 (changing filter is a no-op on stats — assert via shared state object). Reuse: `lib/levels.ts`. Covers: AC 6, 7, 8, 12.

7. **Persistence hook** — `src/lib/persistence.ts`: `loadState()` (try/catch, shape guard, defaults on failure) and `saveState(s)`. Key `langmap.v1`. Tests: `tests/unit/persistence.test.ts` — round-trip, corrupt JSON returns defaults, schema-mismatch (`{languages:"oops"}`) returns defaults. Reuse: none. Covers: AC 14, 15.

8. **WorldMap component** — `src/components/WorldMap.tsx`: renders country TopoJSON (from `world-atlas`) + admin-1 subset; each path's `fillOpacity` from `coverageMap`. Tests: `tests/unit/WorldMap.test.tsx` — given a state, target country path has expected `fill-opacity`; sub-national path renders separately. Reuse: `lib/coverage.ts` from task 5. Covers: AC 1, 3, 4, 5, 10, 11.

9. **LanguagePicker + LanguageList** — `src/components/LanguagePicker.tsx`, `src/components/LanguageList.tsx`: combobox with name/endonym filter, level dropdown, Add button; list rows with remove. Picker dedups (replaces level on re-add). Tests: `tests/unit/LanguagePicker.test.tsx` (AC 16 duplicate-add updates level), `tests/unit/LanguageList.test.tsx` (AC 13 remove). Reuse: `data/languages.ts`, `lib/levels.ts`. Covers: AC 1, 13, 16.

10. **StatsPanel** — `src/components/StatsPanel.tsx`: two cards (Communicate B1+, Get by A1+), country count + population %, `ⓘ` tooltip. Tests: `tests/unit/StatsPanel.test.tsx` — renders counts from `lib/stats.ts`, tooltip text on hover (AC 9), filter prop change does not alter rendered values (AC 12). Reuse: `lib/stats.ts`. Covers: AC 6, 7, 8, 9, 12.

11. **LevelRangeSlider** — `src/components/LevelRangeSlider.tsx`: dual-thumb over `LEVEL_ORDER`, default A1↔Native, emits `{min,max}`. Tests: `tests/unit/LevelRangeSlider.test.tsx` — initial value, change events, snaps to discrete steps. Reuse: `lib/levels.ts`. Covers: AC 10, 11.

12. **App composition + persistence wiring** — `src/App.tsx`, `src/styles.css`: layout (map / sidebar / stats / slider), holds `AppState`, hydrates via `loadState`, persists on every change. Replace existing scaffold body. Tests: `tests/unit/App.test.tsx` — hydrates from seeded `localStorage`; corrupted value loads defaults. Reuse: all of `src/lib/*`, all components. Covers: AC 14, 15, plus integration of all above.

13. **End-to-end suite** — `tests/e2e/v1.spec.ts`: covers the full PRD scenarios in a real browser (add Spanish-B2 → opacity check; add Catalan-B2 alone → Spain unfilled, CT filled; English-A2 + French-C1 → CA at 0.70; B1+ filter hides English; reload → state restored; remove → cleared; tooltip on `ⓘ`). Reuse: none. Covers: AC 1, 3, 4, 9, 10, 13, 14.

14. **Full language curation** — expand `src/data/languages.ts` to ~80 entries per the plan (UN officials, top-30 by speaker count, regional with sub-national). New sub-national codes added here also require new features in `admin1-subset.json`. Tests: extend `tests/unit/languages.test.ts` — count ≥ 80, every sub-national code has a matching feature in `admin1-subset.json`. Reuse: tasks 3 & 4. Covers: dataset breadth for the manual verification script (no new AC; ensures AC 1–11 hold across realistic inputs).

## Addendum (2026-04-30): M49 → ISO 3166-1 alpha-2 mapping location

The `world-atlas/countries-110m.json` TopoJSON encodes country features by UN M49 numeric codes (e.g. `"724"` for Spain), while our `RegionRef` domain is ISO 3166-1 alpha-2 (`"ES"`). Task 8 (`WorldMap`) needs a translation table to bridge the two. Decision: keep the ~165-entry `M49_TO_ISO` table inline in `src/components/WorldMap.tsx`. It has exactly one consumer, the data is static and small, and promoting it to `src/data/m49-to-iso.ts` would be premature abstraction per `CLAUDE.md`. If a second consumer ever appears, move it then. Task 8 is amended accordingly — no new file required.

## Follow-ups (non-blocking for v1)

- `tsconfig.node.json` + `playwright.config.ts` produce errors under `tsc -b`. Production code (`tsc --noEmit -p tsconfig.json`) is clean. Scaffold-level cleanup; address before any future cycle that touches build config.
- Task 14 (full curation to ~80 languages) intentionally deferred. All 16 PRD acceptance criteria pass on the 10-language seed, and the PRD non-goals already call v1 a "curated dataset." Pick up when broader manual-verification coverage is wanted.
