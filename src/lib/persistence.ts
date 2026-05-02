import type { AppState, Level, UserLanguage } from "../types";
import { LEVEL_ORDER } from "./levels";

const KEY = "langmap.v1";

const DEFAULT_STATE: AppState = {
  languages: [],
  filter: { min: "A1", max: "Native" },
};

function isLevel(v: unknown): v is Level {
  return typeof v === "string" && (LEVEL_ORDER as string[]).includes(v);
}

function isUserLanguage(v: unknown): v is UserLanguage {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && isLevel(o.level);
}

function parseState(raw: unknown): AppState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.languages)) return null;
  for (const l of o.languages) {
    if (!isUserLanguage(l)) return null;
  }
  if (typeof o.filter !== "object" || o.filter === null) return null;
  const f = o.filter as Record<string, unknown>;
  if (!isLevel(f.min) || !isLevel(f.max)) return null;
  return {
    languages: o.languages as UserLanguage[],
    filter: { min: f.min, max: f.max },
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return { ...DEFAULT_STATE, filter: { ...DEFAULT_STATE.filter } };
    const parsed = JSON.parse(raw) as unknown;
    const valid = parseState(parsed);
    if (valid === null) return { ...DEFAULT_STATE, filter: { ...DEFAULT_STATE.filter } };
    return valid;
  } catch {
    return { ...DEFAULT_STATE, filter: { ...DEFAULT_STATE.filter } };
  }
}

export function saveState(s: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
