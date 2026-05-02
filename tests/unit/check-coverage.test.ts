import { describe, it, expect } from "vitest";
// The implementer extracts the core logic into a pure function so it's testable
// without touching the filesystem or process.exit. The script (`scripts/check-coverage.ts`)
// imports this same function and wires it to fs + exit codes.
import { checkCoverage } from "../../scripts/check-coverage";
import type { Language } from "../../src/types";

const SPANISH: Language = {
  id: "spa",
  name: "Spanish",
  speakers: { l1: 1, l2: 1 },
  regions: ["ES", "MX"],
};

const CATALAN: Language = {
  id: "cat",
  name: "Catalan",
  speakers: { l1: 1, l2: 1 },
  regions: ["ES-CT", "ES-IB", "ES-VC", "AD"],
};

describe("checkCoverage()", () => {
  it("a (country, language) pair present in language.regions is not a failure", () => {
    const { failures } = checkCoverage(
      [SPANISH],
      [{ countryIso: "ES", languageId: "spa", languageName: "Spanish" }],
      [],
      new Set<string>(),
    );
    expect(failures).toEqual([]);
  });

  it("a missing (country, language) pair is reported as a failure", () => {
    const { failures } = checkCoverage(
      [SPANISH],
      [{ countryIso: "FR", languageId: "spa", languageName: "Spanish" }],
      [],
      new Set<string>(),
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({ countryIso: "FR", languageId: "spa" });
  });

  it("a documented exception suppresses the failure", () => {
    const { failures } = checkCoverage(
      [SPANISH],
      [{ countryIso: "FR", languageId: "spa", languageName: "Spanish" }],
      [{ countryIso: "FR", languageId: "spa", reason: "not actually official" }],
      new Set<string>(),
    );
    expect(failures).toEqual([]);
  });

  it("a sub-national region under a parent country counts as covering the country (Catalan covers ES via ES-CT)", () => {
    const { failures } = checkCoverage(
      [CATALAN],
      [{ countryIso: "ES", languageId: "cat", languageName: "Catalan" }],
      [],
      new Set<string>(["ES-CT", "ES-IB", "ES-VC"]),
    );
    expect(failures).toEqual([]);
  });

  it("a region referenced by a language but not in the polygon set is a warning, not a failure", () => {
    const { failures, warnings } = checkCoverage(
      [{ ...SPANISH, regions: ["ES", "XX-YY"] }],
      [],
      [],
      new Set<string>(["ES"]),
    );
    expect(failures).toEqual([]);
    expect(warnings.some((w) => /XX-YY/.test(w))).toBe(true);
  });
});
