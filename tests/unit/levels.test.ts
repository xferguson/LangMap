import { describe, it, expect } from "vitest";
import {
  LEVEL_ORDER,
  LEVEL_OPACITY,
  COMMUNICATE_THRESHOLD,
  GETBY_THRESHOLD,
  levelAtLeast,
  levelInRange,
} from "../../src/lib/levels";
import type { Level } from "../../src/types";

describe("LEVEL_ORDER", () => {
  it("lists the seven CEFR levels in ascending order", () => {
    expect(LEVEL_ORDER).toEqual(["A1", "A2", "B1", "B2", "C1", "C2", "Native"]);
  });
});

describe("LEVEL_OPACITY (AC 2)", () => {
  it("maps each level to the exact PRD opacity", () => {
    expect(LEVEL_OPACITY.A1).toBe(0.15);
    expect(LEVEL_OPACITY.A2).toBe(0.25);
    expect(LEVEL_OPACITY.B1).toBe(0.4);
    expect(LEVEL_OPACITY.B2).toBe(0.55);
    expect(LEVEL_OPACITY.C1).toBe(0.7);
    expect(LEVEL_OPACITY.C2).toBe(0.75);
    expect(LEVEL_OPACITY.Native).toBe(0.75);
  });

  it("has an entry for every level in LEVEL_ORDER", () => {
    for (const lvl of LEVEL_ORDER) {
      expect(typeof LEVEL_OPACITY[lvl]).toBe("number");
    }
  });
});

describe("thresholds", () => {
  it("COMMUNICATE_THRESHOLD is B1", () => {
    expect(COMMUNICATE_THRESHOLD).toBe("B1");
  });

  it("GETBY_THRESHOLD is A1", () => {
    expect(GETBY_THRESHOLD).toBe("A1");
  });
});

describe("levelAtLeast", () => {
  it("returns true when both levels are equal", () => {
    expect(levelAtLeast("B1", "B1")).toBe(true);
    expect(levelAtLeast("Native", "Native")).toBe(true);
  });

  it("returns true when first level is strictly higher", () => {
    expect(levelAtLeast("B2", "B1")).toBe(true);
    expect(levelAtLeast("Native", "A1")).toBe(true);
  });

  it("returns false when first level is strictly lower", () => {
    expect(levelAtLeast("A2", "B1")).toBe(false);
    expect(levelAtLeast("A1", "Native")).toBe(false);
  });
});

describe("levelInRange", () => {
  it("includes the min endpoint", () => {
    expect(levelInRange("B1", "B1", "Native")).toBe(true);
  });

  it("includes the max endpoint", () => {
    expect(levelInRange("Native", "B1", "Native")).toBe(true);
  });

  it("excludes a level below the min", () => {
    expect(levelInRange("A2", "B1", "Native")).toBe(false);
  });

  it("excludes a level above the max", () => {
    expect(levelInRange("Native", "A1", "A2")).toBe(false);
  });

  it("accepts the default A1..Native range for every level", () => {
    const all: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];
    for (const lvl of all) {
      expect(levelInRange(lvl, "A1", "Native")).toBe(true);
    }
  });
});
