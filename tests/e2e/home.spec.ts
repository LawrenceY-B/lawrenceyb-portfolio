import { expect, mockMarket, test } from "./fixtures";

test.describe("with motion", () => {
  test("preloader finishes, hero and live ticker render, no errors", async ({ page, errors }) => {
    await mockMarket(page);
    await page.goto("/");
    await expect(page.locator("#loader")).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/js-loading/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Lawrence");
    const ticker = page.getByRole("region", { name: /Ghana market data/ });
    await expect(ticker).toContainText("● Live");
    await expect(ticker).toContainText("GSE-CI");
    await expect(ticker).toContainText("T-Bill 91D");
    expect(errors).toEqual([]);
  });

  test("API down: ticker shows Offline and the page still loads", async ({ page }) => {
    await mockMarket(page, "down");
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/js-loading/, { timeout: 15_000 });
    await expect(page.getByRole("region", { name: /Ghana market data/ })).toContainText(
      "● Offline",
    );
  });

  test("returning from a case study skips the preloader and can scroll", async ({ page }) => {
    await mockMarket(page);
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/js-loading/, { timeout: 15_000 });
    await page.getByRole("link", { name: "Open case study: Trade Sim" }).click();
    await expect(page).toHaveURL(/\/work\/trade-sim\/?$/);
    await page.getByRole("link", { name: "← All work" }).click();
    await expect(page).toHaveURL(/\/#work$/);
    await expect(page.locator("#loader")).toBeHidden();
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(400, 300);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(before);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("skips the preloader and shows static lists", async ({ page, errors }) => {
    await mockMarket(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/reduce/);
    await expect(page.locator("#loader")).toBeHidden();
    await expect(page.locator("#build .static-list")).toBeVisible();
    await expect(page.locator("#deploy")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("project rows open case study pages", async ({ page }) => {
    await mockMarket(page);
    await page.goto("/");
    await page.getByRole("link", { name: "Open case study: Treasury Bills API" }).click();
    await expect(page).toHaveURL(/\/work\/treasury-bills-api\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Treasury Bills API" })).toBeVisible();
    await expect(page.getByRole("link", { name: "API docs ↗" })).toHaveAttribute("rel", /noopener/);
    await page.getByRole("link", { name: "← All work" }).click();
    await expect(page).toHaveURL(/\/#work$/);
    await expect(page.locator("#work")).toBeVisible();
  });

  test("case study pages load directly", async ({ page }) => {
    await page.goto("/work/trade-sim");
    await expect(page.getByRole("heading", { level: 1, name: "Trade Sim" })).toBeVisible();
    await page.getByRole("link", { name: /Next →/ }).click();
    await expect(page).toHaveURL(/\/work\/treasury-bills-api\/?$/);
  });

  test("theme toggle persists across reloads", async ({ page }) => {
    await mockMarket(page);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  });

  test("footer shows the build version and /version.json matches", async ({ page, request }) => {
    await mockMarket(page);
    await page.goto("/");
    const info = (await (await request.get("/version.json")).json()) as {
      version: string;
      commit: string | null;
    };
    expect(info.version).toMatch(/^\d+\.\d+\.\d+$/);
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: `v${info.version}` })).toHaveAttribute(
      "href",
      new RegExp(`/releases/tag/v${info.version}$`),
    );
    if (info.commit) await expect(footer).toContainText(info.commit.slice(0, 7));
  });

  test("inspect mode toggles with the I key", async ({ page }) => {
    await mockMarket(page);
    await page.goto("/");
    await page.keyboard.press("i");
    await expect(page.locator("#inspectBtn")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#probe .box").first()).toBeVisible();
    await page.keyboard.press("i");
    await expect(page.locator("#inspectBtn")).toHaveAttribute("aria-pressed", "false");
  });
});
