import { describe, it, expect } from "vitest";
import {
  WORLD_POPULATION,
  countriesAtOrAbove,
  populationAtOrAbove,
} from "../../src/lib/stats";
import { LANGUAGES } from "../../src/data/languages";
import {
  SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2,
  makeState,
  userLang,
} from "./fixtures/states";

function lang(id: string) {
  const l = LANGUAGES.find((x) => x.id === id);
  if (!l) throw new Error(`lang ${id} missing from dataset`);
  return l;
}

describe("WORLD_POPULATION constant", () => {
  it("is the value used to compute population %", () => {
    expect(WORLD_POPULATION).toBe(8.1e9);
  });
});

describe("countriesAtOrAbove (AC 6, 8)", () => {
  it("AC 6 — B1+ excludes English-A2 from Spanish-Native + English-A2 + Catalan-B2", () => {
    const state = SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2;
    const count = countriesAtOrAbove(state, "B1");

    // Compute expected: distinct country codes from Spanish + Catalan, sub-national rolled up to ES
    const expected = new Set<string>();
    for (const r of lang("spa").regions) expected.add(r.split("-")[0]);
    for (const r of lang("cat").regions) expected.add(r.split("-")[0]);

    expect(count).toBe(expected.size);

    // English-A2-only countries (e.g., GB, US, AU) should NOT be counted (they're not in Spanish or Catalan)
    const englishOnly = lang("eng").regions.find(
      (r) =>
        !lang("spa").regions.includes(r) &&
        !lang("cat").regions.some((cr) => cr.split("-")[0] === r),
    );
    expect(englishOnly, "test fixture needs an English-only country").toBeDefined();
  });

  it("AC 8 — A1+ count is greater than or equal to B1+ count", () => {
    const state = SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2;
    const a1 = countriesAtOrAbove(state, "A1");
    const b1 = countriesAtOrAbove(state, "B1");
    expect(a1).toBeGreaterThanOrEqual(b1);
    // and strictly greater here because English-A2 adds countries
    expect(a1).toBeGreaterThan(b1);
  });

  it("rolls sub-national codes up to their country", () => {
    const state = makeState([userLang("cat", "B2")]);
    // Catalan covers ES-CT, ES-IB, ES-VC, AD → 2 distinct countries (ES, AD)
    const count = countriesAtOrAbove(state, "B1");
    expect(count).toBe(2);
  });

  it("returns 0 for an empty state", () => {
    expect(countriesAtOrAbove(makeState([]), "A1")).toBe(0);
  });
});

describe("populationAtOrAbove (AC 7, 8)", () => {
  it("AC 7 — exact ratio of summed L1+L2 over WORLD_POPULATION for B1+", () => {
    const state = SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2;
    const ratio = populationAtOrAbove(state, "B1");
    const expected =
      (lang("spa").speakers.l1 +
        lang("spa").speakers.l2 +
        lang("cat").speakers.l1 +
        lang("cat").speakers.l2) /
      WORLD_POPULATION;
    expect(ratio).toBeCloseTo(expected, 10);
  });

  it("AC 8 — A1+ ratio is greater than or equal to B1+ ratio", () => {
    const state = SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2;
    const a1 = populationAtOrAbove(state, "A1");
    const b1 = populationAtOrAbove(state, "B1");
    expect(a1).toBeGreaterThanOrEqual(b1);
    expect(a1).toBeGreaterThan(b1);
  });

  it("returns 0 for an empty state", () => {
    expect(populationAtOrAbove(makeState([]), "A1")).toBe(0);
  });
});

describe("AC 12 — filter range is a no-op on stats", () => {
  it("countriesAtOrAbove is unchanged when the filter narrows", () => {
    const wide = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "A1",
      "Native",
    );
    const narrow = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "B2",
      "C1",
    );
    expect(countriesAtOrAbove(wide, "B1")).toBe(countriesAtOrAbove(narrow, "B1"));
    expect(countriesAtOrAbove(wide, "A1")).toBe(countriesAtOrAbove(narrow, "A1"));
  });

  it("populationAtOrAbove is unchanged when the filter narrows", () => {
    const wide = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "A1",
      "Native",
    );
    const narrow = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "B2",
      "C1",
    );
    expect(populationAtOrAbove(wide, "B1")).toBe(
      populationAtOrAbove(narrow, "B1"),
    );
    expect(populationAtOrAbove(wide, "A1")).toBe(
      populationAtOrAbove(narrow, "A1"),
    );
  });
});
