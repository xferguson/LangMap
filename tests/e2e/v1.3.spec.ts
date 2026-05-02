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

const EIGHT_LANGS: Array<[string, string]> = [
  ["spa", "Native"],
  ["eng", "B2"],
  ["fra", "B1"],
  ["deu", "A2"],
  ["por", "A1"],
  ["ita", "B2"],
  ["cmn", "A1"],
  ["jpn", "B1"],
];

const TWELVE_LANGS: Array<[string, string]> = [
  ...EIGHT_LANGS,
  ["ara", "A2"],
  ["rus", "A1"],
  ["kor", "A1"],
  ["hin", "A1"],
];

test.describe("Language Map v1.3 — map cleanup + side panel polish", () => {
  test.beforeEach(async ({ page }) => {
    await mockTiles(page);
    await clearStorage(page);
  });

  test("v1.3-1 — no full-width thin polygon paths render (no antimeridian stripes)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Wait for Leaflet to mount and paint at least one country polygon.
    await expect(page.locator(".leaflet-container").first()).toBeVisible();
    await expect(page.locator('[data-region="ES"]').first()).toBeVisible();

    const mapWidth = await page
      .locator('[data-testid="world-map"]')
      .evaluate((el) => el.getBoundingClientRect().width);

    const offenders = await page.evaluate((mw: number) => {
      const paths = Array.from(
        document.querySelectorAll(".leaflet-overlay-pane path"),
      ) as SVGPathElement[];
      const bad: Array<{ region: string | null; w: number; h: number }> = [];
      for (const p of paths) {
        const r = p.getBoundingClientRect();
        if (r.width >= 0.9 * mw && r.height < 5) {
          bad.push({
            region: p.getAttribute("data-region"),
            w: r.width,
            h: r.height,
          });
        }
      }
      return bad;
    }, mapWidth);

    expect(offenders).toEqual([]);
  });

  test("v1.3-3 — Antarctica is either absent or rendered as a proper polygon (not a band)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await expect(page.locator(".leaflet-container").first()).toBeVisible();
    await expect(page.locator('[data-region="ES"]').first()).toBeVisible();

    const aqCount = await page.locator('path[data-region="AQ"]').count();
    if (aqCount === 0) {
      // Per ADR 0004 decision 1, AQ is dropped — this is the expected path.
      return;
    }

    // If AQ is present (alternative ADR path), confirm no AQ path is the
    // horizontal band we're trying to eliminate.
    const offenders = await page.evaluate(() => {
      const paths = Array.from(
        document.querySelectorAll('path[data-region="AQ"]'),
      ) as SVGPathElement[];
      return paths
        .map((p) => p.getBoundingClientRect())
        .filter((r) => r.height < 5)
        .map((r) => ({ w: r.width, h: r.height }));
    });
    expect(offenders).toEqual([]);
  });

  test("v1.3-4 + v1.3-5 — no scroll bars on panel or page at 1024×768 with 8 languages", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    for (const [id, level] of EIGHT_LANGS) {
      await addLanguage(page, id, level);
    }

    // Side panel itself does not scroll (v1.3-4).
    const panelMetrics = await page
      .getByTestId("side-panel")
      .evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
    // +1 tolerates 1px subpixel rounding in layout.
    expect(panelMetrics.scrollHeight).toBeLessThanOrEqual(panelMetrics.clientHeight + 1);
    expect(panelMetrics.scrollWidth).toBeLessThanOrEqual(panelMetrics.clientWidth + 1);

    // Page-level no-scroll (v1.3-5, retained from v1.2-9).
    const pageMetrics = await page.evaluate(() => ({
      sh: document.documentElement.scrollHeight,
      ih: window.innerHeight,
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
    }));
    expect(pageMetrics.sh).toBeLessThanOrEqual(pageMetrics.ih);
    expect(pageMetrics.sw).toBeLessThanOrEqual(pageMetrics.iw);
  });

  test("v1.3-7 — at 12 languages, only the language-list region scrolls; picker/stats/filter stay visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    for (const [id, level] of TWELVE_LANGS) {
      await addLanguage(page, id, level);
    }

    const list = page.getByTestId("panel-section-list");

    // The list region's overflow-y must be `auto` AND its content must
    // actually overflow (otherwise we're not really exercising the
    // internal-scroll behavior).
    const listMetrics = await list.evaluate((el) => ({
      overflowY: window.getComputedStyle(el).overflowY,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(listMetrics.overflowY).toBe("auto");
    expect(listMetrics.scrollHeight).toBeGreaterThan(listMetrics.clientHeight);

    // The other three sections must remain inside the panel's bounding box
    // (i.e. they stay pinned and visible, not pushed offscreen).
    const panel = page.getByTestId("side-panel");
    const panelRect = await panel.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    });

    for (const id of ["panel-section-add", "panel-section-stats", "panel-section-filter"]) {
      const r = await page.getByTestId(id).evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      });
      // Each section's vertical extent must lie within the panel.
      expect(r.top).toBeGreaterThanOrEqual(panelRect.top - 1);
      expect(r.bottom).toBeLessThanOrEqual(panelRect.bottom + 1);
    }
  });

  test("v1.3-8 — long language names don't wrap; level badge and remove button stay on the row", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    // English is the short-name baseline; Scottish Gaelic ("gla") is the long
    // name we expect to truncate with ellipsis if it exceeds the available
    // width on a 360px panel row.
    await addLanguage(page, "eng", "B2");
    await addLanguage(page, "gla", "C1");

    const engRow = page.getByTestId("language-row-eng");
    const glaRow = page.getByTestId("language-row-gla");

    const engHeight = await engRow.evaluate((el) => el.getBoundingClientRect().height);
    const glaHeight = await glaRow.evaluate((el) => el.getBoundingClientRect().height);
    // The long-name row must be the same height as the baseline row (no wrap).
    expect(glaHeight).toBeCloseTo(engHeight, 0);

    // The row's visible name span must use ellipsis when it overflows.
    const nameOverflow = await glaRow.evaluate((el) => {
      // Find the name span — either by class `.language-row-name` (per ADR)
      // or as the first child <span> of the <li>.
      const named = el.querySelector(".language-row-name") as HTMLElement | null;
      const span = (named ?? el.querySelector("span")) as HTMLElement | null;
      if (!span) return null;
      const cs = window.getComputedStyle(span);
      return {
        textOverflow: cs.textOverflow,
        whiteSpace: cs.whiteSpace,
        overflow: cs.overflow,
        scrollWidth: span.scrollWidth,
        clientWidth: span.clientWidth,
      };
    });
    expect(nameOverflow).not.toBeNull();
    if (nameOverflow!.scrollWidth > nameOverflow!.clientWidth) {
      // When the name overflows its container, ellipsis truncation kicks in.
      expect(nameOverflow!.textOverflow).toBe("ellipsis");
      expect(nameOverflow!.whiteSpace).toBe("nowrap");
    }

    // Level badge and remove button must be visible and within the row's
    // horizontal bounds (not clipped offscreen).
    const removeBtn = page.getByTestId("language-row-remove-gla");
    await expect(removeBtn).toBeVisible();

    const rowRect = await glaRow.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
    const btnRect = await removeBtn.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
    expect(btnRect.right).toBeLessThanOrEqual(rowRect.right + 1);
    expect(btnRect.left).toBeGreaterThanOrEqual(rowRect.left - 1);
    expect(btnRect.top).toBeGreaterThanOrEqual(rowRect.top - 1);
    expect(btnRect.bottom).toBeLessThanOrEqual(rowRect.bottom + 1);
  });
});
