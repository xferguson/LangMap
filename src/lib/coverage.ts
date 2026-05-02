import type { AppState, RegionRef } from "../types";
import { LANGUAGES } from "../data/languages";
import { LEVEL_OPACITY, levelInRange } from "./levels";

function buildMap(state: AppState): Map<RegionRef, number> {
  const out = new Map<RegionRef, number>();
  for (const ul of state.languages) {
    if (!levelInRange(ul.level, state.filter.min, state.filter.max)) continue;
    const lang = LANGUAGES.find((l) => l.id === ul.id);
    if (!lang) continue;
    const op = LEVEL_OPACITY[ul.level];
    for (const r of lang.regions) {
      const prev = out.get(r);
      if (prev === undefined || op > prev) out.set(r, op);
    }
  }
  return out;
}

export function coverageFor(state: AppState, region: RegionRef): number | null {
  const map = buildMap(state);
  const v = map.get(region);
  return v === undefined ? null : v;
}

export function coverageMap(state: AppState): Map<RegionRef, number> {
  return buildMap(state);
}
