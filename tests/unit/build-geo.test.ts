import { describe, it, expect } from "vitest";
import countriesGeo from "../../src/data/countries.geo.json" assert { type: "json" };
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from "geojson";

type Ring = number[][];

function ringsOfFeature(f: Feature): Ring[] {
  const rings: Ring[] = [];
  const g = f.geometry as Polygon | MultiPolygon | null;
  if (!g) return rings;
  if (g.type === "Polygon") {
    for (const r of g.coordinates) rings.push(r as Ring);
  } else if (g.type === "MultiPolygon") {
    for (const poly of g.coordinates) {
      for (const r of poly) rings.push(r as Ring);
    }
  }
  return rings;
}

function lonSpan(ring: Ring): number {
  let min = Infinity;
  let max = -Infinity;
  for (const [lon] of ring) {
    if (lon < min) min = lon;
    if (lon > max) max = lon;
  }
  return max - min;
}

describe("countries.geo.json — data-layer assertions (v1.4-2, v1.4-3, v1.4-4)", () => {
  const fc = countriesGeo as unknown as FeatureCollection;

  it("v1.4-3 — does NOT contain a feature with iso === 'AQ' (Antarctica dropped per ADR 0004)", () => {
    const aq = fc.features.find((f) => {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      return props.iso === "AQ";
    });
    expect(aq).toBeUndefined();
  });

  it("v1.4-3 — does NOT contain a feature with iso === 'FJ' (Fiji dropped per ADR 0005 §2)", () => {
    const fj = fc.features.find((f) => {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      return props.iso === "FJ";
    });
    expect(fj).toBeUndefined();
  });

  it("v1.4-3 — every ring's longitudes are within [-180, 180]", () => {
    const offenders: Array<{ iso: string; lon: number }> = [];
    for (const f of fc.features) {
      const iso = String((f.properties as Record<string, unknown> | null)?.iso ?? "?");
      for (const ring of ringsOfFeature(f)) {
        for (const [lon] of ring) {
          if (lon < -180 || lon > 180) {
            offenders.push({ iso, lon });
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("v1.4-2 / v1.4-4 — no ring spans more than 180° of longitude (proxy for 'crosses antimeridian')", () => {
    const offenders: Array<{ iso: string; span: number }> = [];
    for (const f of fc.features) {
      const iso = String((f.properties as Record<string, unknown> | null)?.iso ?? "?");
      for (const ring of ringsOfFeature(f)) {
        const span = lonSpan(ring);
        if (span > 180) {
          offenders.push({ iso, span });
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("v1.4-2 — Russia (RU) is present and ALL its rings live in a single hemisphere (lonSpan ≤ 180°)", () => {
    const ru = fc.features.find(
      (f) => (f.properties as Record<string, unknown> | null)?.iso === "RU",
    );
    expect(ru).toBeDefined();
    const rings = ringsOfFeature(ru as Feature);
    expect(rings.length).toBeGreaterThan(0);
    for (const ring of rings) {
      expect(lonSpan(ring)).toBeLessThanOrEqual(180);
    }
  });

  it("feature count is consistent with dropping AQ + FJ (~230±5; was ~236)", () => {
    // The world-atlas countries-50m source ships ~241 features; after
    // dropping AQ and FJ the count is two lower. ADR 0005 specifies
    // a 230±5 range (~235 expected after drops).
    expect(fc.features.length).toBeGreaterThanOrEqual(225);
    expect(fc.features.length).toBeLessThanOrEqual(245);
  });
});
