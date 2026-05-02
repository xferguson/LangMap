import { test, expect, Page } from "@playwright/test";

// 1x1 transparent PNG bytes — used to stub CartoDB tile responses so that
// tests don't depend on the live tile CDN.
const BLANK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=",
  "base64",
);

async function mockTiles(page: Page) {
  await page.route("**/basemaps.cartocdn.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: BLANK_PNG,
    });
  });
}

async function clearStorage(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });
}

async function addLanguage(page: Page, id: string, level: string) {
  await page.getByTestId("language-picker-language").selectOption(id);
  await page.getByTestId("language-picker-level").selectOption(level);
  await page.getByTestId("language-picker-add").click();
}

function durationToSeconds(value: string): number {
  // CSSOM resolves transition-duration as e.g. "0.24s" or "240ms".
  // For multi-property transitions it can be a comma-separated list — take
  // the max of all parts.
  const parts = value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  let max = 0;
  for (const p of parts) {
    if (p.endsWith("ms")) {
      max = Math.max(max, Number(p.slice(0, -2)) / 1000);
    } else if (p.endsWith("s")) {
      max = Math.max(max, Number(p.slice(0, -1)));
    } else {
      const n = Number(p);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  return max;
}

test.describe("Language Map v1.5 — mobile drawer + touch targets", () => {
  test.beforeEach(async ({ page }) => {
    await mockTiles(page);
    await clearStorage(page);
  });

  test("v1.5-1, v1.5-2, v1.5-7 — mobile: panel hidden by default; toggle visible; touch targets meet floor sizes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator(".leaflet-container").first()).toBeVisible();

    // Drawer hidden by default.
    await expect(page.getByTestId("side-panel")).toHaveAttribute(
      "data-state",
      "closed",
    );

    // Toggle visible at mobile viewport.
    await expect(page.getByTestId("drawer-toggle")).toBeVisible();

    // Open the drawer to assert touch targets on its controls.
    await page.getByTestId("drawer-toggle").click();
    await expect(page.getByTestId("side-panel")).toHaveAttribute(
      "data-state",
      "open",
    );

    // Slider thumb ≥ 24×24.
    const thumbMin = page.getByTestId("level-range-thumb-min");
    await expect(thumbMin).toBeVisible();
    const thumbBox = await thumbMin.boundingBox();
    expect(thumbBox).not.toBeNull();
    expect(thumbBox!.width).toBeGreaterThanOrEqual(24);
    expect(thumbBox!.height).toBeGreaterThanOrEqual(24);

    // Language and level <select> ≥ 36 px tall.
    const langSelectBox = await page
      .getByTestId("language-picker-language")
      .boundingBox();
    expect(langSelectBox).not.toBeNull();
    expect(langSelectBox!.height).toBeGreaterThanOrEqual(36);

    const levelSelectBox = await page
      .getByTestId("language-picker-level")
      .boundingBox();
    expect(levelSelectBox).not.toBeNull();
    expect(levelSelectBox!.height).toBeGreaterThanOrEqual(36);

    // Add button ≥ 36 px tall.
    const addBox = await page.getByTestId("language-picker-add").boundingBox();
    expect(addBox).not.toBeNull();
    expect(addBox!.height).toBeGreaterThanOrEqual(36);

    // Add a language so the remove button renders, then assert ≥ 32×32.
    await addLanguage(page, "spa", "B2");
    const removeBox = await page
      .getByTestId("language-row-remove-spa")
      .boundingBox();
    expect(removeBox).not.toBeNull();
    expect(removeBox!.width).toBeGreaterThanOrEqual(32);
    expect(removeBox!.height).toBeGreaterThanOrEqual(32);
  });

  test("v1.5-3, v1.5-4 — mobile: tap toggle opens drawer; tap overlay closes; transition ≤ 300 ms", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator(".leaflet-container").first()).toBeVisible();

    const panel = page.getByTestId("side-panel");
    const toggle = page.getByTestId("drawer-toggle");
    const overlay = page.getByTestId("drawer-overlay");

    await expect(panel).toHaveAttribute("data-state", "closed");

    await toggle.click();
    await expect(panel).toHaveAttribute("data-state", "open");
    await expect(overlay).toHaveAttribute("data-state", "open");

    // Tap overlay closes the drawer.
    await overlay.click();
    await expect(panel).toHaveAttribute("data-state", "closed");
    await expect(overlay).toHaveAttribute("data-state", "closed");

    // Transition duration on the side panel resolves to ≤ 0.3s.
    const durationStr = await panel.evaluate(
      (el) => getComputedStyle(el).transitionDuration,
    );
    const seconds = durationToSeconds(durationStr);
    expect(seconds).toBeLessThanOrEqual(0.3);
  });

  test("v1.5-8 — Leaflet attribution clears the home-indicator safe area on a notched mobile profile", async ({
    page,
  }) => {
    // Notched profile (iPhone 14 Pro): 393×852, home-indicator zone ≈ 34 px tall.
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");

    await expect(page.locator(".leaflet-container").first()).toBeVisible();

    // Wait for Leaflet's default attribution control to render inside the map.
    const attribution = page.locator(".leaflet-control-attribution").first();
    await expect(attribution).toBeVisible();

    // Sanity check: the attribution text matches PRD v1.5-8.
    await expect(attribution).toContainText("OpenStreetMap");
    await expect(attribution).toContainText("CARTO");

    // The PRD acceptance criterion is that the attribution is "not clipped,
    // hidden, or overlapped by the device's home-indicator safe area". Chromium
    // does not synthesize real env(safe-area-inset-*) values from the DevTools
    // device profile, so we audit the CSS contract directly: some rule in the
    // app stylesheets must apply a bottom-side spacing that resolves to
    // env(safe-area-inset-bottom, …) and applies to the Leaflet attribution
    // (either on .leaflet-control-attribution itself, .leaflet-container, or a
    // wrapping element that pushes the attribution off the home-indicator
    // strip). Padding on .side-panel (the drawer) does NOT count — the drawer
    // is hidden by default on mobile and does not contain the attribution.
    const safeAreaContractHolds = await page.evaluate(() => {
      const attrEl = document.querySelector(
        ".leaflet-control-attribution",
      ) as HTMLElement | null;
      if (!attrEl) return false;

      const candidateSelectors = [
        ".leaflet-control-attribution",
        ".leaflet-bottom",
        ".leaflet-bottom.leaflet-right",
        ".leaflet-container",
        ".world-map-root",
        '[data-testid="world-map"]',
      ];

      // Walk every CSSStyleSheet rule and check whether any matching selector
      // applies a bottom-side spacing rule that references safe-area-inset-bottom.
      const sheets = Array.from(document.styleSheets) as CSSStyleSheet[];
      for (const sheet of sheets) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          const collect: CSSStyleRule[] = [];
          if (rule instanceof CSSStyleRule) collect.push(rule);
          if (rule instanceof CSSMediaRule) {
            for (let j = 0; j < rule.cssRules.length; j++) {
              const inner = rule.cssRules[j];
              if (inner instanceof CSSStyleRule) collect.push(inner);
            }
          }
          for (const styleRule of collect) {
            const sel = styleRule.selectorText || "";
            if (!candidateSelectors.some((c) => sel.includes(c))) continue;
            const css = styleRule.style.cssText;
            if (
              /(padding-bottom|margin-bottom|bottom)\s*:[^;]*safe-area-inset-bottom/i.test(
                css,
              )
            ) {
              return true;
            }
          }
        }
      }
      return false;
    });

    expect(
      safeAreaContractHolds,
      "Expected an app stylesheet rule on the Leaflet attribution / its container / its map root to apply a bottom-edge spacing that resolves to env(safe-area-inset-bottom, …). The v1.5 implementation only padded .side-panel, which does not contain the attribution and is hidden by default on mobile.",
    ).toBe(true);
  });

  test("v1.5-6, v1.5-9 — desktop: no drawer-toggle, no drawer-overlay, layout matches v1.4", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await expect(page.locator(".leaflet-container").first()).toBeVisible();

    // Toggle is not visible to the user at desktop viewport.
    expect(await page.getByTestId("drawer-toggle").isHidden()).toBe(true);

    // Overlay is not visible to the user at desktop viewport.
    expect(await page.getByTestId("drawer-overlay").isHidden()).toBe(true);

    // Side panel is in the DOM and is the first child of <main>.
    const panel = page.getByTestId("side-panel");
    await expect(panel).toBeVisible();
    const isFirstChildOfMain = await panel.evaluate((el) => {
      const main = el.closest("main");
      return main !== null && main.firstElementChild === el;
    });
    expect(isFirstChildOfMain).toBe(true);

    // <main> grid-template-columns resolves to a 2-column track starting with 360px.
    const cols = await page
      .locator("main")
      .first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    // Expect "360px <something>" — first track is 360px exactly.
    const tracks = cols.trim().split(/\s+/);
    expect(tracks.length).toBeGreaterThanOrEqual(2);
    expect(tracks[0]).toBe("360px");
  });
});
