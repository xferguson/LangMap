import { describe, it, expect } from "vitest";
import { coverageFor, coverageMap } from "../../src/lib/coverage";
import {
  CATALAN_B2,
  ENGLISH_A2,
  ENGLISH_A2_FRENCH_C1,
  SPANISH_NATIVE,
  makeState,
  userLang,
} from "./fixtures/states";

describe("coverageFor (AC 3, 4, 5, 10, 11)", () => {
  it("AC 3 — max-opacity dedup: English-A2 + French-C1 over Canada is 0.70", () => {
    expect(coverageFor(ENGLISH_A2_FRENCH_C1, "CA")).toBeCloseTo(0.7, 5);
  });

  it("AC 3 — does not additively blend overlapping languages", () => {
    const value = coverageFor(ENGLISH_A2_FRENCH_C1, "CA");
    expect(value).not.toBeCloseTo(0.85, 5);
    expect(value).not.toBeCloseTo(0.95, 5);
  });

  it("AC 4 — Catalan only fills CT/IB/VC, not Spain", () => {
    expect(coverageFor(CATALAN_B2, "ES-CT")).toBeCloseTo(0.55, 5);
    expect(coverageFor(CATALAN_B2, "ES-IB")).toBeCloseTo(0.55, 5);
    expect(coverageFor(CATALAN_B2, "ES-VC")).toBeCloseTo(0.55, 5);
    expect(coverageFor(CATALAN_B2, "ES")).toBeNull();
  });

  it("AC 5 — Spanish-Native fills ES at 0.75; sub-national codes are not separately listed", () => {
    expect(coverageFor(SPANISH_NATIVE, "ES")).toBeCloseTo(0.75, 5);
    // sub-national entries are not separately added by a country-level language
    expect(coverageFor(SPANISH_NATIVE, "ES-CT")).toBeNull();
  });

  it("returns null for a region with no covering language", () => {
    expect(coverageFor(ENGLISH_A2, "ES")).toBeNull();
  });

  it("AC 10 — filter min above a language's level hides its regions", () => {
    const state = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "B1",
      "Native",
    );
    // English-A2 regions are filtered out
    expect(coverageFor(state, "GB")).toBeNull();
    // Spanish-Native regions still render
    expect(coverageFor(state, "ES")).toBeCloseTo(0.75, 5);
  });

  it("AC 11 — filter max below a language's level hides its regions", () => {
    const state = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "A1",
      "A2",
    );
    // Spanish-Native is above A2 → its regions are filtered out
    expect(coverageFor(state, "ES")).toBeNull();
    // English-A2 still renders
    expect(coverageFor(state, "GB")).toBeCloseTo(0.25, 5);
  });
});

describe("coverageMap", () => {
  it("returns a Map keyed by RegionRef", () => {
    const map = coverageMap(SPANISH_NATIVE);
    expect(map).toBeInstanceOf(Map);
    expect(map.get("ES")).toBeCloseTo(0.75, 5);
  });

  it("AC 4 — Catalan-only coverage map has no entry for ES", () => {
    const map = coverageMap(CATALAN_B2);
    expect(map.has("ES-CT")).toBe(true);
    expect(map.has("ES")).toBe(false);
  });

  it("AC 3 — overlapping languages produce a single max-opacity entry", () => {
    const map = coverageMap(ENGLISH_A2_FRENCH_C1);
    expect(map.get("CA")).toBeCloseTo(0.7, 5);
  });

  it("excludes regions whose contributing levels fall outside the filter range", () => {
    const state = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "B1",
      "Native",
    );
    const map = coverageMap(state);
    expect(map.has("GB")).toBe(false);
    expect(map.get("ES")).toBeCloseTo(0.75, 5);
  });
});
