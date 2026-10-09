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

  test("case study opens as a modal, traps focus, closes on Escape", async ({ page }) => {
    await mockMarket(page);
    await page.goto("/");
    const opener = page.getByRole("button", { name: "Open case study: Treasury Bills API" });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Treasury Bills API" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Close/ })).toBeFocused();
    await expect(dialog.getByRole("link", { name: "API docs ↗" })).toHaveAttribute(
      "rel",
      /noopener/,
    );
    // Background is inert, so Tab cycles only through the sheet.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(
          () =>
            !!document.activeElement?.closest("#sheet") || document.activeElement === document.body,
        ),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
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
