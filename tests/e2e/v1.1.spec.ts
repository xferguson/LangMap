import { test, expect, Page } from "@playwright/test";

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

test.describe("Language Map v1.1 — UX polish + bugfix", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test("v1.1-3 — at 1280x800 with up to 8 languages, neither the page nor the side panel scrolls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Add 8 languages from the seed dataset.
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

    // No page-level scrolling (vertical or horizontal).
    const noScroll = await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= window.innerHeight &&
        document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noScroll).toBe(true);

    // The map and all four side-panel control roots must be visible.
    await expect(page.getByTestId("world-map")).toBeVisible();
    const panel = page.getByTestId("side-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId("language-picker-language")).toBeVisible();
    await expect(panel.getByTestId("stats-communicate")).toBeVisible();
    await expect(panel.getByTestId("stats-getby")).toBeVisible();
    await expect(panel.getByTestId("level-range-slider")).toBeVisible();
  });

  test("v1.1-2 — exactly one side panel exists and contains all four control surfaces", async ({
    page,
  }) => {
    await page.goto("/");
    const panels = page.getByTestId("side-panel");
    await expect(panels).toHaveCount(1);

    const panel = panels.first();
    await expect(panel.getByTestId("language-picker-language")).toBeVisible();
    await expect(panel.getByTestId("language-picker-level")).toBeVisible();
    await expect(panel.getByTestId("language-picker-add")).toBeVisible();
    await expect(panel.getByTestId("stats-communicate")).toBeVisible();
    await expect(panel.getByTestId("stats-getby")).toBeVisible();
    await expect(panel.getByTestId("level-range-slider")).toBeVisible();
  });

  test("v1.1-1 — every rendered <path data-region> matches a valid ISO code (no orphans)", async ({
    page,
  }) => {
    await page.goto("/");

    const result = await page.evaluate(() => {
      const ISO_ALPHA2 = /^[A-Z]{2}$/;
      const ISO_3166_2 = /^[A-Z]{2}-[A-Z0-9]{1,3}$/;
      const paths = Array.from(document.querySelectorAll("path"));
      const bad: string[] = [];
      for (const p of paths) {
        const code = p.getAttribute("data-region");
        if (code === null || code === "" || code === "undefined") {
          bad.push("(missing)");
          continue;
        }
        if (!ISO_ALPHA2.test(code) && !ISO_3166_2.test(code)) {
          bad.push(code);
        }
      }
      return { total: paths.length, bad };
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.bad).toEqual([]);
  });
});
