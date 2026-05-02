// Dataset integrity: every language's region references must resolve to a
// polygon in countries.geo.json or admin1.geo.json. Failures here mean
// "user adds language X and gets no highlight" or "highlight covers fewer
// regions than the language entry promises".
import { describe, expect, it } from "vitest";
import type { Feature, FeatureCollection } from "geojson";
import { LANGUAGES } from "../../src/data/languages";
import countriesGeo from "../../src/data/countries.geo.json";
import admin1Geo from "../../src/data/admin1.geo.json";

const COUNTRIES = countriesGeo as unknown as FeatureCollection;
const ADMIN1 = admin1Geo as unknown as FeatureCollection;

const POLYGON_ISOS: Set<string> = new Set([
  ...COUNTRIES.features.map((f: Feature) => (f.properties as { iso?: string } | null)?.iso ?? ""),
  ...ADMIN1.features.map((f: Feature) => (f.properties as { iso?: string } | null)?.iso ?? ""),
].filter(Boolean));

// Known intentional gaps documented in ADR 0005 §Decision 2:
// Fiji's polygon was dropped due to antimeridian rendering artifacts.
// Re-introduction is a v1.5+ follow-up.
const KNOWN_REGION_GAPS: ReadonlySet<string> = new Set(["FJ"]);

describe("dataset integrity — every language → polygon mapping", () => {
  it("every language has at least one resolvable region (or is documented as regionless, e.g. Esperanto)", () => {
    const orphans: { id: string; name: string; regions: string[] }[] = [];
    for (const lang of LANGUAGES) {
      if (lang.regions.length === 0) continue; // e.g. Esperanto: intentionally regionless
      const resolvable = lang.regions.filter(
        (r) => POLYGON_ISOS.has(r) || KNOWN_REGION_GAPS.has(r),
      );
      if (resolvable.length === 0) {
        orphans.push({ id: lang.id, name: lang.name, regions: lang.regions });
      }
    }
    expect(orphans, `Languages with NO renderable region: ${JSON.stringify(orphans, null, 2)}`).toEqual([]);
  });

  it("every region referenced by every language has a polygon (allowing the documented FJ gap)", () => {
    const missing: { langId: string; langName: string; region: string }[] = [];
    for (const lang of LANGUAGES) {
      for (const region of lang.regions) {
        if (POLYGON_ISOS.has(region)) continue;
        if (KNOWN_REGION_GAPS.has(region)) continue;
        missing.push({ langId: lang.id, langName: lang.name, region });
      }
    }
    expect(missing, `Region references with no polygon: ${JSON.stringify(missing, null, 2)}`).toEqual([]);
  });

  it("the documented gaps don't grow unexpectedly (regression guard)", () => {
    const gapsActuallyHit = new Set<string>();
    for (const lang of LANGUAGES) {
      for (const region of lang.regions) {
        if (KNOWN_REGION_GAPS.has(region)) gapsActuallyHit.add(region);
      }
    }
    // Exactly the documented set should be hit; nothing more, nothing less.
    expect([...gapsActuallyHit].sort()).toEqual([...KNOWN_REGION_GAPS].sort());
  });

  it("Russian (rus) resolves to RU and several CIS countries", () => {
    // Spot check the language the user flagged. Confirms regions field +
    // dedupById survival + GeoJSON presence in one assertion.
    const rus = LANGUAGES.find((l) => l.id === "rus");
    expect(rus, "Russian entry must exist in LANGUAGES").toBeDefined();
    if (!rus) return;
    expect(rus.regions).toContain("RU");
    expect(POLYGON_ISOS.has("RU"), "RU must have a polygon").toBe(true);
    // Core CIS / former-USSR coverage that should highlight on Russian-Native:
    for (const r of ["RU", "BY", "KZ", "UA"]) {
      expect(rus.regions).toContain(r);
      expect(POLYGON_ISOS.has(r), `${r} must have a polygon`).toBe(true);
    }
  });
});
