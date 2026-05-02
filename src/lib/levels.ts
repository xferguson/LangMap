import type { Level } from "../types";

export const LEVEL_ORDER: Level[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "Native",
];

export const LEVEL_OPACITY: Record<Level, number> = {
  A1: 0.15,
  A2: 0.25,
  B1: 0.4,
  B2: 0.55,
  C1: 0.7,
  C2: 0.75,
  Native: 0.75,
};

export const COMMUNICATE_THRESHOLD: Level = "B1";
export const GETBY_THRESHOLD: Level = "A1";

export function levelAtLeast(a: Level, b: Level): boolean {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b);
}

export function levelInRange(l: Level, min: Level, max: Level): boolean {
  const i = LEVEL_ORDER.indexOf(l);
  return i >= LEVEL_ORDER.indexOf(min) && i <= LEVEL_ORDER.indexOf(max);
}
