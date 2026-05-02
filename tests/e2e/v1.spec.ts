import { test, expect, Page } from "@playwright/test";

async function clearStorage(page: Page) {
  // Navigate to the app origin once so localStorage is accessible, clear it,
  // then let each test do its own page.goto("/") for a fresh load.
  // We deliberately do NOT use addInitScript here — that would re-run on every
  // reload and wipe state we just persisted (breaking the reload-persistence
  // test).
  await page.goto("/");
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });
}

async function addLanguage(page: Page, name: string, level: string) {
  await page.getByTestId("language-picker-language").selectOption(idForName(name));
  await page.getByTestId("language-picker-level").selectOption(level);
  await page.getByTestId("language-picker-add").click();
}

function idForName(name: string): string {
  switch (name.toLowerCase()) {
    case "spanish":
      return "spa";
    case "english":
      return "eng";
    case "french":
      return "fra";
    case "catalan":
      return "cat";
    case "german":
      return "deu";
    case "portuguese":
      return "por";
    case "italian":
      return "ita";
    case "mandarin":
      return "cmn";
    case "arabic":
      return "ara";
    case "japanese":
      return "jpn";
    default:
      throw new Error(`unknown language ${name}`);
  }
}

async function fillOpacity(page: Page, code: string): Promise<number | null> {
  const handle = page.locator(`[data-region="${code}"]`).first();
  if ((await handle.count()) === 0) return null;
  const fo = await handle.getAttribute("fill-opacity");
  if (fo === null || fo === "") return null;
  const n = Number(fo);
  if (!Number.isFinite(n)) return null;
  // v1.4: uncovered countries now carry fill-opacity="0" (not absent). Treat
  // 0 as the "no coverage" sentinel for these legacy v1 assertions.
  if (n === 0) return null;
  return n;
}

async function setFilterMin(page: Page, target: string): Promise<void> {
  const order = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];
  const slider = page.getByTestId("level-range-slider");
  const current = (await slider.getAttribute("data-min")) ?? "A1";
  const from = order.indexOf(current);
  const to = order.indexOf(target);
  const thumb = page.getByTestId("level-range-thumb-min");
  await thumb.focus();
  const key = to > from ? "ArrowRight" : "ArrowLeft";
  for (let i = 0; i < Math.abs(to - from); i++) await page.keyboard.press(key);
}

async function setFilterMax(page: Page, target: string): Promise<void> {
  const order = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];
  const slider = page.getByTestId("level-range-slider");
  const current = (await slider.getAttribute("data-max")) ?? "Native";
  const from = order.indexOf(current);
  const to = order.indexOf(target);
  const thumb = page.getByTestId("level-range-thumb-max");
  await thumb.focus();
  const key = to > from ? "ArrowRight" : "ArrowLeft";
  for (let i = 0; i < Math.abs(to - from); i++) await page.keyboard.press(key);
}

test.describe("Language Map v1 — end-to-end", () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test("AC 1 — adding Spanish-B2 fills Spain at 0.55", async ({ page }) => {
    await page.goto("/");
    await addLanguage(page, "Spanish", "B2");
    await expect(page.getByTestId("language-row-spa")).toBeVisible();
    await expect(page.locator('[data-region="ES"]').first()).toBeVisible();
    expect(await fillOpacity(page, "ES")).toBeCloseTo(0.55, 5);
  });

  test("AC 4 — Catalan-only fills CT but leaves Spain unfilled", async ({ page }) => {
    await page.goto("/");
    await addLanguage(page, "Catalan", "B2");
    expect(await fillOpacity(page, "ES-CT")).toBeCloseTo(0.55, 5);
    expect(await fillOpacity(page, "ES")).toBeNull();
  });

  test("AC 3 — English-A2 + French-C1 renders Canada at 0.70 (max-opacity dedup)", async ({
    page,
  }) => {
    await page.goto("/");
    await addLanguage(page, "English", "A2");
    await addLanguage(page, "French", "C1");
    expect(await fillOpacity(page, "CA")).toBeCloseTo(0.7, 5);
  });

  test("AC 10 — filter min B1 hides English-A2 regions", async ({ page }) => {
    await page.goto("/");
    await addLanguage(page, "English", "A2");
    await addLanguage(page, "Spanish", "Native");

    // Both visible at default range
    expect(await fillOpacity(page, "GB")).toBeCloseTo(0.25, 5);
    expect(await fillOpacity(page, "ES")).toBeCloseTo(0.75, 5);

    // Move filter min to B1
    await setFilterMin(page, "B1");
    expect(await fillOpacity(page, "GB")).toBeNull();
    expect(await fillOpacity(page, "ES")).toBeCloseTo(0.75, 5);
  });

  test("AC 14 — reload restores languages and filter range", async ({ page }) => {
    await page.goto("/");
    await addLanguage(page, "Spanish", "Native");
    await addLanguage(page, "English", "B1");
    await setFilterMin(page, "B1");
    await setFilterMax(page, "C2");

    await page.reload();
    await expect(page.getByTestId("language-row-spa")).toBeVisible();
    await expect(page.getByTestId("language-row-eng")).toBeVisible();
    await expect(page.getByTestId("level-range-slider")).toHaveAttribute(
      "data-min",
      "B1",
    );
    await expect(page.getByTestId("level-range-slider")).toHaveAttribute(
      "data-max",
      "C2",
    );
  });

  test("AC 13 — removing a language clears its regions", async ({ page }) => {
    await page.goto("/");
    await addLanguage(page, "Spanish", "Native");
    expect(await fillOpacity(page, "ES")).toBeCloseTo(0.75, 5);

    await page.getByTestId("language-row-remove-spa").click();
    await expect(page.getByTestId("language-row-spa")).not.toBeVisible();
    expect(await fillOpacity(page, "ES")).toBeNull();
  });

  test("AC 9 — hovering ⓘ shows the overlap-disclaimer tooltip", async ({ page }) => {
    await page.goto("/");
    await addLanguage(page, "Spanish", "Native");
    await page.getByTestId("stats-communicate-info").hover();
    const tip = page.getByTestId("stats-communicate-tooltip");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText(/overlap|bilingual|deduplicate/i);
  });
});
