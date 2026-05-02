import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import type { Topology, GeometryObject } from "topojson-specification";
import type {
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
  Position,
} from "geojson";

const M49_TO_ISO: Record<string, string> = {
  "004": "AF", "008": "AL", "010": "AQ", "012": "DZ", "016": "AS",
  "020": "AD", "024": "AO", "028": "AG", "031": "AZ", "032": "AR",
  "036": "AU", "040": "AT", "044": "BS", "048": "BH", "050": "BD",
  "051": "AM", "052": "BB", "056": "BE", "060": "BM", "064": "BT",
  "068": "BO", "070": "BA", "072": "BW", "076": "BR", "084": "BZ",
  "086": "IO", "090": "SB", "092": "VG", "096": "BN", "100": "BG",
  "104": "MM", "108": "BI", "112": "BY", "116": "KH", "120": "CM",
  "124": "CA", "132": "CV", "136": "KY", "140": "CF", "144": "LK",
  "148": "TD", "152": "CL", "156": "CN", "158": "TW", "170": "CO",
  "174": "KM", "178": "CG", "180": "CD", "184": "CK", "188": "CR",
  "191": "HR", "192": "CU", "196": "CY", "203": "CZ", "204": "BJ",
  "208": "DK", "212": "DM", "214": "DO", "218": "EC", "222": "SV",
  "226": "GQ", "231": "ET", "232": "ER", "233": "EE", "234": "FO",
  "238": "FK", "239": "GS", "242": "FJ", "246": "FI", "248": "AX",
  "250": "FR", "258": "PF", "260": "TF", "262": "DJ", "266": "GA",
  "268": "GE", "270": "GM", "275": "PS", "276": "DE", "288": "GH",
  "296": "KI", "300": "GR", "304": "GL", "308": "GD", "316": "GU",
  "320": "GT", "324": "GN", "328": "GY", "332": "HT", "334": "HM",
  "336": "VA", "340": "HN", "344": "HK", "348": "HU", "352": "IS",
  "356": "IN", "360": "ID", "364": "IR", "368": "IQ", "372": "IE",
  "376": "IL", "380": "IT", "384": "CI", "388": "JM", "392": "JP",
  "398": "KZ", "400": "JO", "404": "KE", "408": "KP", "410": "KR",
  "414": "KW", "417": "KG", "418": "LA", "422": "LB", "426": "LS",
  "428": "LV", "430": "LR", "434": "LY", "438": "LI", "440": "LT",
  "442": "LU", "446": "MO", "450": "MG", "454": "MW", "458": "MY",
  "462": "MV", "466": "ML", "470": "MT", "478": "MR", "480": "MU",
  "484": "MX", "492": "MC", "496": "MN", "498": "MD", "499": "ME",
  "500": "MS", "504": "MA", "508": "MZ", "512": "OM", "516": "NA",
  "520": "NR", "524": "NP", "528": "NL", "531": "CW", "533": "AW",
  "534": "SX", "540": "NC", "548": "VU", "554": "NZ", "558": "NI",
  "562": "NE", "566": "NG", "570": "NU", "574": "NF", "578": "NO",
  "580": "MP", "583": "FM", "584": "MH", "585": "PW", "586": "PK",
  "591": "PA", "598": "PG", "600": "PY", "604": "PE", "608": "PH",
  "612": "PN", "616": "PL", "620": "PT", "624": "GW", "626": "TL",
  "630": "PR", "634": "QA", "642": "RO", "643": "RU", "646": "RW",
  "652": "BL", "654": "SH", "659": "KN", "660": "AI", "662": "LC",
  "663": "MF", "666": "PM", "670": "VC", "674": "SM", "678": "ST",
  "682": "SA", "686": "SN", "688": "RS", "690": "SC", "694": "SL",
  "702": "SG", "703": "SK", "704": "VN", "705": "SI", "706": "SO",
  "710": "ZA", "716": "ZW", "724": "ES", "728": "SS", "729": "SD",
  "732": "EH", "740": "SR", "748": "SZ", "752": "SE", "756": "CH",
  "760": "SY", "762": "TJ", "764": "TH", "768": "TG", "776": "TO",
  "780": "TT", "784": "AE", "788": "TN", "792": "TR", "795": "TM",
  "796": "TC", "800": "UG", "804": "UA", "807": "MK", "818": "EG",
  "826": "GB", "831": "GG", "832": "JE", "833": "IM", "834": "TZ",
  "840": "US", "850": "VI", "854": "BF", "858": "UY", "860": "UZ",
  "862": "VE", "876": "WF", "882": "WS", "887": "YE", "894": "ZM",
};

const NAME_TO_ISO: Record<string, string> = {
  "Kosovo": "XK",
};

function lonSpanOf(ring: Position[]): number {
  let min = Infinity;
  let max = -Infinity;
  for (const [lon] of ring) {
    if (lon < min) min = lon;
    if (lon > max) max = lon;
  }
  return max - min;
}

// Linear interpolation: latitude where the short-path edge a→b crosses
// the antimeridian. a and b are on opposite hemispheres.
function latAtAntimeridian(a: Position, b: Position): number {
  const [aLon, aLat] = a;
  const [bLon, bLat] = b;
  // Shift b so the edge a→b is monotonic in lon (no wraparound).
  // If a is east (>0), b's "shifted" representation is bLon + 360.
  // If a is west (<0), b's "shifted" representation is bLon - 360.
  const bShifted = aLon > 0 ? bLon + 360 : bLon - 360;
  const target = aLon > 0 ? 180 : -180;
  const t = (target - aLon) / (bShifted - aLon);
  return aLat + t * (bLat - aLat);
}

// Split a closed ring at every antimeridian crossing into one or more
// closed sub-rings, each entirely within one hemisphere.
// Adds (±180, lat) closure points along the antimeridian.
function splitRingAtAntimeridian(ring: Position[]): Position[][] {
  if (ring.length < 2) return [ring];

  const segments: Position[][] = [[ring[0]]];
  let crossed = false;

  for (let i = 1; i < ring.length; i++) {
    const prev = ring[i - 1];
    const curr = ring[i];
    if (Math.abs(curr[0] - prev[0]) > 180) {
      crossed = true;
      const lat = latAtAntimeridian(prev, curr);
      const prevSide = prev[0] > 0 ? 180 : -180;
      const currSide = curr[0] > 0 ? 180 : -180;
      segments[segments.length - 1].push([prevSide, lat]);
      segments.push([[currSide, lat]]);
    }
    segments[segments.length - 1].push(curr);
  }

  if (!crossed) return [ring];

  // The first and last segments belong to the same hemisphere (the ring is
  // closed and starts/ends on the same point). Stitch them.
  if (segments.length > 1) {
    const first = segments.shift() as Position[];
    const last = segments.pop() as Position[];
    segments.unshift([...last, ...first]);
  }

  // Close each ring (first === last). The closing edge runs along the
  // antimeridian, which is the desired behaviour — the polygon's eastern (or
  // western) boundary visually sits exactly at ±180°.
  return segments.map((s) => {
    if (s.length === 0) return s;
    const a = s[0];
    const b = s[s.length - 1];
    if (a[0] !== b[0] || a[1] !== b[1]) {
      s.push([a[0], a[1]]);
    }
    return s;
  });
}

// Split every ring (outer + holes) of a polygon. Inner rings (holes) that
// don't cross the antimeridian pass through unchanged. Inner rings that
// do cross are split into separate polygons (we don't try to associate
// split holes back with the right outer ring — Russia's mainland has no
// holes that cross the antimeridian, so this is a no-op for the data we
// ship). Each output polygon has a single outer ring.
function splitPolygonAtAntimeridian(poly: Position[][]): Position[][][] {
  const outer = poly[0];
  if (lonSpanOf(outer) <= 180) {
    return [poly];
  }
  const splitOuters = splitRingAtAntimeridian(outer);
  return splitOuters.map((r) => [r]);
}

function main(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const ROOT = resolve(__dirname, "..");
  const SRC = resolve(ROOT, "node_modules", "world-atlas", "countries-50m.json");
  const OUT = resolve(ROOT, "src", "data", "countries.geo.json");

  const topo = JSON.parse(readFileSync(SRC, "utf8")) as Topology;
  const fc = feature(topo, topo.objects.countries as GeometryObject) as unknown as FeatureCollection;

  const out: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  for (const f of fc.features) {
    const rawId = (f as Feature & { id?: string | number }).id;
    let key: string | null = null;
    if (typeof rawId === "string") key = rawId.padStart(3, "0");
    else if (typeof rawId === "number") key = String(rawId).padStart(3, "0");
    let iso: string | undefined;
    if (key) iso = M49_TO_ISO[key];
    if (!iso) {
      const name = (f.properties as Record<string, unknown> | null)?.name;
      if (typeof name === "string") iso = NAME_TO_ISO[name];
    }
    if (!iso) continue;
    if (iso === "AQ") continue;
    if (iso === "FJ") continue;
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const geom = f.geometry;
    let outGeom = geom;
    if (geom && geom.type === "MultiPolygon") {
      const mp = geom as MultiPolygon;
      const splitPolys: Position[][][] = [];
      for (const poly of mp.coordinates) {
        for (const split of splitPolygonAtAntimeridian(poly as Position[][])) {
          splitPolys.push(split);
        }
      }
      outGeom = { type: "MultiPolygon", coordinates: splitPolys };
    } else if (geom && geom.type === "Polygon") {
      const pg = geom as Polygon;
      const split = splitPolygonAtAntimeridian(pg.coordinates as Position[][]);
      if (split.length === 1) {
        outGeom = { type: "Polygon", coordinates: split[0] };
      } else {
        outGeom = { type: "MultiPolygon", coordinates: split };
      }
    }
    out.features.push({
      type: "Feature",
      geometry: outGeom,
      properties: { ...props, iso },
    });
  }

  writeFileSync(OUT, JSON.stringify(out));
  process.stdout.write(`wrote ${out.features.length} country features to ${OUT}\n`);
}

function isInvokedDirectly(): boolean {
  if (!process.argv[1]) return false;
  const argv1 = process.argv[1].replace(/\\/g, "/");
  const meta = import.meta.url.replace(/\\/g, "/");
  // Compare file basenames; covers `tsx scripts/build-geo.ts` invocation.
  const argvBase = argv1.split("/").pop() ?? "";
  const metaBase = meta.split("/").pop() ?? "";
  return argvBase === metaBase && metaBase === "build-geo.ts";
}

if (isInvokedDirectly()) {
  main();
}
