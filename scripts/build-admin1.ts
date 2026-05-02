import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import type { Topology, GeometryObject } from "topojson-specification";
import type { FeatureCollection, Feature } from "geojson";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "src", "data", "admin1-subset.json");
const OUT = resolve(ROOT, "src", "data", "admin1.geo.json");

const topo = JSON.parse(readFileSync(SRC, "utf8")) as Topology;
const objKey = Object.keys(topo.objects)[0];
const fc = feature(topo, topo.objects[objKey] as GeometryObject) as unknown as FeatureCollection;

const out: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

for (const f of fc.features) {
  const rawId =
    (f as Feature & { id?: string | number }).id ??
    (f.properties as Record<string, unknown> | null)?.id ??
    null;
  if (typeof rawId !== "string") continue;
  out.features.push({
    type: "Feature",
    geometry: f.geometry,
    properties: { ...((f.properties ?? {}) as Record<string, unknown>), iso: rawId },
  });
}

writeFileSync(OUT, JSON.stringify(out));
process.stdout.write(`wrote ${out.features.length} admin1 features to ${OUT}\n`);
