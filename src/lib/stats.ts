import type { AppState, Level } from "../types";
import { LANGUAGES } from "../data/languages";
import { levelAtLeast } from "./levels";

export const WORLD_POPULATION = 8.1e9;

function qualifyingLanguages(state: AppState, level: Level) {
  return state.languages.filter((ul) => levelAtLeast(ul.level, level));
}

export function countriesAtOrAbove(state: AppState, level: Level): number {
  const countries = new Set<string>();
  for (const ul of qualifyingLanguages(state, level)) {
    const lang = LANGUAGES.find((l) => l.id === ul.id);
    if (!lang) continue;
    for (const r of lang.regions) {
      countries.add(r.split("-")[0]);
    }
  }
  return countries.size;
}

export function populationAtOrAbove(state: AppState, level: Level): number {
  let total = 0;
  for (const ul of qualifyingLanguages(state, level)) {
    const lang = LANGUAGES.find((l) => l.id === ul.id);
    if (!lang) continue;
    total += lang.speakers.l1 + lang.speakers.l2;
  }
  return total / WORLD_POPULATION;
}
