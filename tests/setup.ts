import "@testing-library/jest-dom/vitest";

// jsdom polyfill so Leaflet can mount under unit tests.
// Leaflet measures the container's bounding rect / clientWidth / clientHeight
// during initialization to position tiles; jsdom returns zeros which causes
// `<MapContainer>` to throw or refuse to render. We force non-zero dimensions.

const RECT = {
  width: 1024,
  height: 768,
  top: 0,
  left: 0,
  right: 1024,
  bottom: 768,
  x: 0,
  y: 0,
  toJSON() {
    return RECT;
  },
};

Element.prototype.getBoundingClientRect = function () {
  return RECT as DOMRect;
};

Object.defineProperty(HTMLElement.prototype, "clientWidth", {
  configurable: true,
  get() {
    return 1024;
  },
});

Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  get() {
    return 768;
  },
});

// jsdom's SVGSVGElement is missing the SVG 1.1 helper methods Leaflet's
// Browser detection probes (`Browser.svg` checks `createSVGRect` exists).
// Without these, Leaflet decides SVG is unsupported and L.svg() returns
// null, so vector layers can't be rendered.
const svgProto = (
  typeof SVGSVGElement !== "undefined" ? SVGSVGElement.prototype : null
) as (SVGSVGElement & { createSVGRect?: () => DOMRect }) | null;
if (svgProto && typeof svgProto.createSVGRect !== "function") {
  svgProto.createSVGRect = function (): DOMRect {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON() {
        return this;
      },
    } as DOMRect;
  };
}
