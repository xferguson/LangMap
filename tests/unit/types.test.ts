import { describe, it, expectTypeOf, expect } from "vitest";
import type {
  Level,
  RegionRef,
  Language,
  UserLanguage,
  AppState,
} from "../../src/types";
// Force a runtime resolution of src/types so missing-module fails this file.
// (The named export is unused at runtime; types.ts only needs to exist.)
import * as _typesModule from "../../src/types";

describe("types module presence", () => {
  it("the src/types module resolves at runtime", () => {
    expect(_typesModule).toBeDefined();
  });
});

describe("types module", () => {
  it("exposes Level as the seven CEFR labels", () => {
    const a: Level = "A1";
    const b: Level = "Native";
    expect(a).toBe("A1");
    expect(b).toBe("Native");
    expectTypeOf<Level>().toEqualTypeOf<
      "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Native"
    >();
  });

  it("RegionRef is a string alias for ISO codes", () => {
    const r1: RegionRef = "ES";
    const r2: RegionRef = "ES-CT";
    expect(r1).toBe("ES");
    expect(r2).toBe("ES-CT");
  });

  it("Language has id, name, speakers and regions", () => {
    const lang: Language = {
      id: "spa",
      name: "Spanish",
      speakers: { l1: 1, l2: 2 },
      regions: ["ES"],
    };
    expect(lang.id).toBe("spa");
    expect(lang.regions).toEqual(["ES"]);
  });

  it("UserLanguage pairs an id with a level", () => {
    const ul: UserLanguage = { id: "spa", level: "B2" };
    expect(ul.level).toBe("B2");
  });

  it("AppState carries languages and filter range", () => {
    const s: AppState = {
      languages: [{ id: "spa", level: "B2" }],
      filter: { min: "A1", max: "Native" },
    };
    expect(s.filter.min).toBe("A1");
    expect(s.filter.max).toBe("Native");
  });
});
