import { describe, it, expect } from "vitest";
import { LANGUAGES } from "../../src/data/languages";
import type { Language } from "../../src/types";

const REGION_RE = /^[A-Z]{2}(-[A-Z0-9]{1,3})?$/;

describe("LANGUAGES dataset (AC 1, 4, 5 prerequisites)", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(LANGUAGES)).toBe(true);
    expect(LANGUAGES.length).toBeGreaterThan(0);
  });

  it("every entry has id, name, speakers, and a regions array", () => {
    for (const lang of LANGUAGES) {
      expect(typeof lang.id).toBe("string");
      expect(lang.id.length).toBeGreaterThan(0);
      expect(typeof lang.name).toBe("string");
      expect(lang.name.length).toBeGreaterThan(0);
      expect(typeof lang.speakers.l1).toBe("number");
      expect(typeof lang.speakers.l2).toBe("number");
      expect(Array.isArray(lang.regions)).toBe(true);
    }
  });

  it("has unique ids", () => {
    const ids = LANGUAGES.map((l) => l.id);
    const set = new Set(ids);
    expect(set.size).toBe(ids.length);
  });

  it("every region code matches ISO 3166-1 alpha-2 or 3166-2 form", () => {
    for (const lang of LANGUAGES) {
      for (const r of lang.regions) {
        expect(r, `lang ${lang.id} region ${r}`).toMatch(REGION_RE);
      }
    }
  });

  it("includes Spanish (spa) covering Spain", () => {
    const spa = LANGUAGES.find((l) => l.id === "spa");
    expect(spa, "Spanish must be in dataset").toBeDefined();
    expect(spa!.regions).toContain("ES");
  });

  it("includes English (eng) covering Canada, US, GB", () => {
    const eng = LANGUAGES.find((l) => l.id === "eng");
    expect(eng, "English must be in dataset").toBeDefined();
    expect(eng!.regions).toContain("CA");
    expect(eng!.regions).toContain("US");
    expect(eng!.regions).toContain("GB");
  });

  it("includes French (fra) covering Canada and France", () => {
    const fra = LANGUAGES.find((l) => l.id === "fra");
    expect(fra, "French must be in dataset").toBeDefined();
    expect(fra!.regions).toContain("CA");
    expect(fra!.regions).toContain("FR");
  });

  it("Catalan (cat) only covers ES sub-national codes plus Andorra — no plain ES", () => {
    const cat = LANGUAGES.find((l) => l.id === "cat");
    expect(cat, "Catalan must be in dataset").toBeDefined();
    expect(cat!.regions).toContain("ES-CT");
    expect(cat!.regions).toContain("ES-IB");
    expect(cat!.regions).toContain("ES-VC");
    expect(cat!.regions).toContain("AD");
    expect(cat!.regions).not.toContain("ES");
  });
});
