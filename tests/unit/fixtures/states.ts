import type { AppState, Level, UserLanguage } from "../../../src/types";

export const ALL_LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];

export function userLang(id: string, level: Level): UserLanguage {
  return { id, level };
}

export function makeState(
  languages: UserLanguage[],
  min: Level = "A1",
  max: Level = "Native",
): AppState {
  return { languages, filter: { min, max } };
}

export const EMPTY_STATE: AppState = makeState([]);

export const SPANISH_NATIVE = makeState([userLang("spa", "Native")]);
export const ENGLISH_A2 = makeState([userLang("eng", "A2")]);
export const FRENCH_C1 = makeState([userLang("fra", "C1")]);
export const CATALAN_B2 = makeState([userLang("cat", "B2")]);

export const ENGLISH_A2_FRENCH_C1 = makeState([
  userLang("eng", "A2"),
  userLang("fra", "C1"),
]);

export const SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2 = makeState([
  userLang("spa", "Native"),
  userLang("eng", "A2"),
  userLang("cat", "B2"),
]);
