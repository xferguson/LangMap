import { describe, it, expect } from "vitest";
import admin1 from "../../src/data/admin1-subset.json";

describe("admin1-subset.json (AC 4 prerequisite)", () => {
  it("parses as a TopoJSON-shaped object", () => {
    expect(admin1).toBeDefined();
    expect(typeof admin1).toBe("object");
    expect((admin1 as Record<string, unknown>).type).toBe("Topology");
    expect((admin1 as Record<string, unknown>).objects).toBeDefined();
  });

  it("contains features for ES-CT, ES-IB, and ES-VC", () => {
    const objects = (admin1 as { objects: Record<string, { geometries: Array<{ id?: string; properties?: { id?: string; iso_3166_2?: string } }> }> }).objects;
    const all: Array<{ id?: string; properties?: { id?: string; iso_3166_2?: string } }> = [];
    for (const key of Object.keys(objects)) {
      for (const g of objects[key].geometries ?? []) all.push(g);
    }

    const codes = new Set<string>();
    for (const f of all) {
      const id = f.id ?? f.properties?.id ?? f.properties?.iso_3166_2;
      if (id) codes.add(id);
    }
    expect(codes.has("ES-CT")).toBe(true);
    expect(codes.has("ES-IB")).toBe(true);
    expect(codes.has("ES-VC")).toBe(true);
  });

  it("every feature has a geometry", () => {
    const objects = (admin1 as { objects: Record<string, { geometries: Array<{ type?: string; arcs?: unknown }> }> }).objects;
    for (const key of Object.keys(objects)) {
      for (const g of objects[key].geometries ?? []) {
        expect(g.type, `feature in ${key} must have geometry type`).toBeTruthy();
      }
    }
  });
});
