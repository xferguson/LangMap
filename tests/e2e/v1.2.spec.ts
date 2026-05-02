import { test, expect, Page } from "@playwright/test";

// 1x1 transparent PNG bytes — the smallest valid PNG. Used to mock CartoDB
// tile responses so CI doesn't depend on the live CDN.
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

test.describe("Language Map v1.2 — Leaflet renderer", () => {
  test.beforeEach(async ({ page }) => {
    await mockTiles(page);
    await clearStorage(page);
  });

  test("v1.2-1 + v1.2-8 — Leaflet container mounts and tile attribution is visible", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("world-map")).toBeVisible();
    // Leaflet's container class is the canonical signal that Leaflet mounted.
    await expect(page.locator(".leaflet-container").first()).toBeVisible();

    // v1.2-8: attribution control includes both OpenStreetMap and CARTO.
    const attribution = page.locator(".leaflet-control-attribution").first();
    await expect(attribution).toBeVisible();
    await expect(attribution).toContainText(/OpenStreetMap/i);
    await expect(attribution).toContainText(/CARTO/i);
  });

  test("v1.2-9 — no page-level scroll at 1280x800 with 8 languages added", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const eight: Array<[string, string]> = [
      ["spa", "Native"],
      ["eng", "B2"],
      ["fra", "B1"],
      ["deu", "A2"],
      ["por", "A1"],
      ["ita", "B2"],
      ["cmn", "A1"],
      ["jpn", "B1"],
    ];
    for (const [id, level] of eight) {
      await addLanguage(page, id, level);
    }

    const noScroll = await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= window.innerHeight &&
        document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noScroll).toBe(true);
  });

  test("v1.1-7 + v1.1-8 (relocated) — Spanish-Native renders ES with blue at ~0.75 opacity", async ({
    page,
  }) => {
    await page.goto("/");
    await addLanguage(page, "spa", "Native");

    // Wait for the country polygon to be rendered into Leaflet's overlay pane.
    const es = page.locator('[data-region="ES"]').first();
    await expect(es).toBeVisible();

    const fillOpacity = await es.getAttribute("fill-opacity");
    expect(Number(fillOpacity)).toBeCloseTo(0.75, 5);

    // v1.1-8: highlight color is a recognizable blue (the locked Tailwind
    // sky-500 hex `#3b82f6` per ADR 0003).
    const fill = await es.getAttribute("fill");
    expect(fill?.toLowerCase()).toBe("#3b82f6");
  });
});
