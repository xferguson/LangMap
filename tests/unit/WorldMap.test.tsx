import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WorldMap } from "../../src/components/WorldMap";
import { coverageMap } from "../../src/lib/coverage";
import {
  CATALAN_B2,
  EMPTY_STATE,
  ENGLISH_A2_FRENCH_C1,
  SPANISH_NATIVE,
  makeState,
  userLang,
} from "./fixtures/states";

function getRegionPath(container: HTMLElement, code: string): SVGPathElement | null {
  return container.querySelector(`[data-region="${code}"]`) as SVGPathElement | null;
}

function fillOpacityOf(el: SVGPathElement | null): number | null {
  if (!el) return null;
  const fo = el.getAttribute("fill-opacity") ?? el.style.fillOpacity ?? null;
  if (fo === null || fo === "") return null;
  const n = Number(fo);
  return Number.isFinite(n) ? n : null;
}

describe("<WorldMap /> v1.2 — Leaflet container mounts (v1.2-1)", () => {
  it("v1.2-1 — exposes data-testid=\"world-map\" on the MapContainer element", () => {
    const { container } = render(<WorldMap state={EMPTY_STATE} />);
    const map = container.querySelector('[data-testid="world-map"]');
    expect(map).not.toBeNull();
  });

  it("v1.2-1 — the world-map element has Leaflet's leaflet-container class", () => {
    const { container } = render(<WorldMap state={EMPTY_STATE} />);
    const map = container.querySelector('[data-testid="world-map"]') as HTMLElement | null;
    expect(map).not.toBeNull();
    // react-leaflet's MapContainer renders a div with class "leaflet-container".
    // Either the testid is on the leaflet-container div directly, or its first
    // descendant div is the leaflet-container.
    const isContainer =
      map!.classList.contains("leaflet-container") ||
      map!.querySelector(".leaflet-container") !== null;
    expect(isContainer).toBe(true);
  });

  it("v1.2-1 — a TileLayer with the CartoDB Positron URL template is rendered", () => {
    const { container } = render(<WorldMap state={EMPTY_STATE} />);
    // Leaflet renders tile <img> elements under .leaflet-tile-pane. The URL
    // template uses the `light_all` Positron layer at carto's CDN. We assert
    // by inspecting the rendered tile <img src> attribute pattern OR the
    // attribution text fallback.
    const tileImgs = Array.from(
      container.querySelectorAll("img.leaflet-tile, .leaflet-tile-pane img"),
    ) as HTMLImageElement[];
    const matched = tileImgs.some((img) =>
      /basemaps\.cartocdn\.com\/light_all\//.test(img.src ?? ""),
    );
    // If no tile <img>s yet (jsdom may not fire load), fall back to checking
    // that the attribution control mentions CARTO + OpenStreetMap.
    const attribution = container.querySelector(".leaflet-control-attribution");
    const attrText = attribution?.textContent ?? "";
    expect(matched || (/CARTO/i.test(attrText) && /OpenStreetMap/i.test(attrText))).toBe(true);
  });

  it("v1.2 — a hidden map-coverage-state element serializes coverageMap(state)", () => {
    const state = SPANISH_NATIVE;
    const { container } = render(<WorldMap state={state} />);
    const node = container.querySelector(
      '[data-testid="map-coverage-state"]',
    ) as HTMLElement | null;
    expect(node).not.toBeNull();
    const raw = node!.getAttribute("data-coverage");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);

    // Compare to the canonical coverage map.
    const expected = [...coverageMap(state)];
    // Order-independent comparison: convert both to sorted JSON.
    const norm = (entries: [string, number][]) =>
      [...entries].sort(([a], [b]) => a.localeCompare(b));
    expect(norm(parsed)).toEqual(norm(expected));
  });
});

describe("<WorldMap /> v1.4-1 — uncovered countries have fill-opacity=\"0\"", () => {
  it("v1.4-1 — empty state: a known country path has fill-opacity attribute set to \"0\" (not absent, not \"1\")", () => {
    const { container } = render(<WorldMap state={EMPTY_STATE} />);
    // Pick a country we know is in the dataset and is not covered by any
    // user language in the empty state (DE has no entry in coverageMap when
    // there are zero user languages).
    const de = getRegionPath(container, "DE");
    expect(de).not.toBeNull();
    const fo = de!.getAttribute("fill-opacity");
    // The attribute MUST be present and equal to the string "0". An absent
    // attribute would let SVG default fill-opacity (=1) apply, which is the
    // v1.3 regression.
    expect(fo).toBe("0");
  });

  it("v1.4-1 — covered country has its fill-opacity attribute set, uncovered stays \"0\"", () => {
    const { container } = render(<WorldMap state={SPANISH_NATIVE} />);
    const es = getRegionPath(container, "ES");
    const de = getRegionPath(container, "DE");
    expect(es).not.toBeNull();
    expect(de).not.toBeNull();
    expect(Number(es!.getAttribute("fill-opacity"))).toBeCloseTo(0.75, 5);
    // DE remains uncovered → its fill-opacity is "0", not absent.
    expect(de!.getAttribute("fill-opacity")).toBe("0");
  });
});

describe("<WorldMap /> opacity contract (preserves v1 AC 1, 3, 4, 5, 10, 11)", () => {
  it("AC 1 — Spanish-B2 fills Spain at 0.55", () => {
    const state = makeState([userLang("spa", "B2")]);
    const { container } = render(<WorldMap state={state} />);
    const es = getRegionPath(container, "ES");
    expect(es).not.toBeNull();
    expect(fillOpacityOf(es)).toBeCloseTo(0.55, 5);
  });

  it("AC 5 — Spanish-Native fills Spain at 0.75", () => {
    const { container } = render(<WorldMap state={SPANISH_NATIVE} />);
    expect(fillOpacityOf(getRegionPath(container, "ES"))).toBeCloseTo(0.75, 5);
  });

  it("AC 4 / v1.2-6 — Catalan-only paints ES-CT at 0.55 and Spain at 0 (transparent)", () => {
    const { container } = render(<WorldMap state={CATALAN_B2} />);
    const es = getRegionPath(container, "ES");
    const ct = getRegionPath(container, "ES-CT");
    expect(ct).not.toBeNull();
    expect(fillOpacityOf(ct)).toBeCloseTo(0.55, 5);

    // v1.2-6: the underlying Spain polygon's fill-opacity is 0 (or attribute
    // is unset / null, which Leaflet treats as the default style fillOpacity 0).
    const esOp = fillOpacityOf(es);
    expect(esOp === null || esOp === 0).toBe(true);
  });

  it("AC 3 — English-A2 + French-C1 renders Canada at 0.70", () => {
    const { container } = render(<WorldMap state={ENGLISH_A2_FRENCH_C1} />);
    expect(fillOpacityOf(getRegionPath(container, "CA"))).toBeCloseTo(0.7, 5);
  });

  it("AC 10 — filter min B1 hides English-A2 regions", () => {
    const state = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "B1",
      "Native",
    );
    const { container } = render(<WorldMap state={state} />);
    const gbOp = fillOpacityOf(getRegionPath(container, "GB"));
    expect(gbOp === null || gbOp === 0).toBe(true);
    expect(fillOpacityOf(getRegionPath(container, "ES"))).toBeCloseTo(0.75, 5);
  });

  it("AC 11 — filter max A2 hides Spanish-Native regions", () => {
    const state = makeState(
      [userLang("eng", "A2"), userLang("spa", "Native")],
      "A1",
      "A2",
    );
    const { container } = render(<WorldMap state={state} />);
    const esOp = fillOpacityOf(getRegionPath(container, "ES"));
    expect(esOp === null || esOp === 0).toBe(true);
    expect(fillOpacityOf(getRegionPath(container, "GB"))).toBeCloseTo(0.25, 5);
  });
});
