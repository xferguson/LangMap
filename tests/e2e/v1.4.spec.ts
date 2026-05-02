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

test.describe("Language Map v1.4 — map regression fixes + filter polish", () => {
  test.beforeEach(async ({ page }) => {
    await mockTiles(page);
    await clearStorage(page);
  });

  test("v1.4-1 — uncovered country (BR) has fill-opacity=\"0\" so the basemap is visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Wait for Leaflet to mount and country polygons to appear.
    await expect(page.locator(".leaflet-container").first()).toBeVisible();
    await expect(page.locator('[data-region="ES"]').first()).toBeVisible();

    // With empty state, no country should render with non-zero fill-opacity.
    // BR (Brazil) is a known feature in countries.geo.json.
    const br = page.locator('[data-region="BR"]').first();
    await expect(br).toBeVisible();
    const fo = await br.getAttribute("fill-opacity");
    expect(fo).toBe("0");

    // Now add Spanish-Native. ES should become 0.75; BR (no Spanish coverage
    // here — BR's official language is Portuguese) should remain "0".
    await addLanguage(page, "spa", "Native");
    const esFo = await page.locator('[data-region="ES"]').first().getAttribute("fill-opacity");
    expect(Number(esFo)).toBeCloseTo(0.75, 5);
    const brFo2 = await page.locator('[data-region="BR"]').first().getAttribute("fill-opacity");
    expect(brFo2).toBe("0");
  });

  test("v1.4-2 + v1.4-3 + v1.4-4 — no full-width stripe/bar paths; AQ and FJ absent", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await expect(page.locator(".leaflet-container").first()).toBeVisible();
    await expect(page.locator('[data-region="ES"]').first()).toBeVisible();

    // AQ and FJ must not render — neither as country features nor as artifacts.
    expect(await page.locator('path[data-region="AQ"]').count()).toBe(0);
    expect(await page.locator('path[data-region="FJ"]').count()).toBe(0);

    const mapWidth = await page
      .locator('[data-testid="world-map"]')
      .evaluate((el) => el.getBoundingClientRect().width);

    // No path in the overlay pane should be a thin full-width bar/stripe at
    // any latitude — strict superset of v1.3-1 / v1.4-2 / v1.4-4.
    const offendersEmpty = await page.evaluate((mw: number) => {
      const paths = Array.from(
        document.querySelectorAll(".leaflet-overlay-pane path"),
      ) as SVGPathElement[];
      const bad: Array<{ region: string | null; w: number; h: number }> = [];
      for (const p of paths) {
        const r = p.getBoundingClientRect();
        if (r.width >= 0.75 * mw && r.height < 8) {
          bad.push({
            region: p.getAttribute("data-region"),
            w: r.width,
            h: r.height,
          });
        }
      }
      return bad;
    }, mapWidth);
    expect(offendersEmpty).toEqual([]);

    // Repeat the assertion after adding 3 languages — covered fills must not
    // produce bars either.
    await addLanguage(page, "spa", "Native");
    await addLanguage(page, "eng", "B2");
    await addLanguage(page, "fra", "B1");

    const offendersFilled = await page.evaluate((mw: number) => {
      const paths = Array.from(
        document.querySelectorAll(".leaflet-overlay-pane path"),
      ) as SVGPathElement[];
      const bad: Array<{ region: string | null; w: number; h: number }> = [];
      for (const p of paths) {
        const r = p.getBoundingClientRect();
        if (r.width >= 0.75 * mw && r.height < 8) {
          bad.push({
            region: p.getAttribute("data-region"),
            w: r.width,
            h: r.height,
          });
        }
      }
      return bad;
    }, mapWidth);
    expect(offendersFilled).toEqual([]);
  });

  test("v1.4-5 — filter section: readout, thumbs, keyboard interaction", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Section is visible.
    const filterSection = page.getByTestId("panel-section-filter");
    await expect(filterSection).toBeVisible();

    // Readout is visible and matches the default A1 ↔ Native range.
    const readout = page.getByTestId("level-range-readout");
    await expect(readout).toBeVisible();
    await expect(readout).toHaveText(/A1.*Native/i);

    // Both thumbs are visible and at least 16x16 px (v1.4-5 thumb size floor).
    const thumbMin = page.getByTestId("level-range-thumb-min");
    const thumbMax = page.getByTestId("level-range-thumb-max");
    await expect(thumbMin).toBeVisible();
    await expect(thumbMax).toBeVisible();

    const thumbMinBox = await thumbMin.boundingBox();
    const thumbMaxBox = await thumbMax.boundingBox();
    expect(thumbMinBox).not.toBeNull();
    expect(thumbMaxBox).not.toBeNull();
    expect(thumbMinBox!.width).toBeGreaterThanOrEqual(16);
    expect(thumbMinBox!.height).toBeGreaterThanOrEqual(16);
    expect(thumbMaxBox!.width).toBeGreaterThanOrEqual(16);
    expect(thumbMaxBox!.height).toBeGreaterThanOrEqual(16);

    // Interact: focus the min thumb, press ArrowRight twice → readout text
    // must change away from "A1 to Native".
    const initialText = (await readout.textContent()) ?? "";
    await thumbMin.click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const updatedText = (await readout.textContent()) ?? "";
    expect(updatedText).not.toBe(initialText);
  });
});
