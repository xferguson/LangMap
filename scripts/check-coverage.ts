import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Language } from "../src/types";

export interface MustIncludePair {
  countryIso: string;
  languageId: string;
  languageName?: string;
}

export interface Exception {
  countryIso: string;
  languageId: string;
  reason?: string;
}

export interface CoverageFailure {
  countryIso: string;
  languageId: string;
  languageName?: string;
}

export interface CoverageResult {
  failures: CoverageFailure[];
  warnings: string[];
}

export function checkCoverage(
  languages: Language[],
  mustInclude: MustIncludePair[],
  exceptions: Exception[],
  polygonCodes: Set<string>,
): CoverageResult {
  const langById = new Map<string, Language>();
  for (const l of languages) langById.set(l.id, l);

  const exceptionKey = (c: string, l: string) => `${c}${l}`;
  const exceptionSet = new Set<string>();
  for (const e of exceptions) exceptionSet.add(exceptionKey(e.countryIso, e.languageId));

  const failures: CoverageFailure[] = [];
  const warnings: string[] = [];

  for (const pair of mustInclude) {
    if (exceptionSet.has(exceptionKey(pair.countryIso, pair.languageId))) continue;
    const lang = langById.get(pair.languageId);
    if (!lang) {
      failures.push({
        countryIso: pair.countryIso,
        languageId: pair.languageId,
        languageName: pair.languageName,
      });
      continue;
    }
    let covered = false;
    for (const r of lang.regions) {
      if (r === pair.countryIso) {
        covered = true;
        break;
      }
      if (
        r.startsWith(`${pair.countryIso}-`) &&
        polygonCodes.has(r)
      ) {
        covered = true;
        break;
      }
    }
    if (!covered) {
      failures.push({
        countryIso: pair.countryIso,
        languageId: pair.languageId,
        languageName: pair.languageName,
      });
    }
  }

  for (const lang of languages) {
    for (const r of lang.regions) {
      if (!polygonCodes.has(r)) {
        warnings.push(
          `language ${lang.id} references region ${r} but no polygon exists`,
        );
      }
    }
  }

  return { failures, warnings };
}

interface GeoFeatureCollection {
  features: Array<{ properties?: Record<string, unknown> | null }>;
}

function loadPolygonCodes(): Set<string> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const ROOT = resolve(__dirname, "..");
  const out = new Set<string>();
  for (const rel of ["src/data/countries.geo.json", "src/data/admin1.geo.json"]) {
    const path = resolve(ROOT, rel);
    try {
      const fc = JSON.parse(readFileSync(path, "utf8")) as GeoFeatureCollection;
      for (const f of fc.features) {
        const iso = f.properties?.iso;
        if (typeof iso === "string") out.add(iso);
      }
    } catch {
      // ignore — file may not exist yet
    }
  }
  return out;
}

async function main(): Promise<void> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const ROOT = resolve(__dirname, "..");

  const toFileUrl = (p: string) => new URL(`file:///${p.replace(/\\/g, "/")}`).href;

  const { LANGUAGES } = (await import(
    toFileUrl(resolve(ROOT, "src/data/languages.ts")),
  )) as { LANGUAGES: Language[] };

  const mustInclude = JSON.parse(
    readFileSync(resolve(ROOT, "src/data/must-include.json"), "utf8"),
  ) as MustIncludePair[];

  const { EXCEPTIONS } = (await import(
    toFileUrl(resolve(ROOT, "src/data/must-include-exceptions.ts")),
  )) as { EXCEPTIONS: Exception[] };

  const polygonCodes = loadPolygonCodes();
  const { failures, warnings } = checkCoverage(
    LANGUAGES,
    mustInclude,
    EXCEPTIONS,
    polygonCodes,
  );

  for (const w of warnings) process.stdout.write(`WARN: ${w}\n`);

  if (failures.length > 0) {
    for (const f of failures) {
      process.stderr.write(
        `FAIL: ${f.countryIso} missing language ${f.languageId}${f.languageName ? ` (${f.languageName})` : ""}\n`,
      );
    }
    process.exit(1);
  }

  process.stdout.write(
    `check-coverage: ${mustInclude.length} pair(s) checked, ${warnings.length} warning(s)\n`,
  );
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] != null &&
  /check-coverage\.ts$/.test(process.argv[1].replace(/\\/g, "/"));

if (invokedDirectly) {
  void main();
}
