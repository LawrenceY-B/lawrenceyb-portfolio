import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "./fixtures";

test("unknown routes get the 404 page with the requested path", async ({ page, errors }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page burnt out.");
  await expect(page.locator(".log")).toContainText("curl -I /no-such-page");
  await expect(page.locator("#gl")).toBeVisible();
  await page.getByRole("link", { name: "Back home" }).click();
  await expect(page).toHaveURL(/\/$/);
  // The browser logs the document's own 404 status; anything else is a real error.
  expect(errors.filter((e) => !e.includes("status of 404"))).toEqual([]);
});

test("the 404 terminal runs commands and cd ~ goes home", async ({ page }) => {
  await page.goto("/no-such-page");
  // Typing anywhere focuses the prompt.
  await page.keyboard.type("help");
  await expect(page.getByRole("textbox", { name: "Terminal command" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".term")).toContainText("sudo fix");
  await page.keyboard.type("nope");
  await page.keyboard.press("Enter");
  await expect(page.locator(".term")).toContainText("command not found: nope");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("textbox", { name: "Terminal command" })).toHaveValue("nope");
  await page.getByRole("textbox", { name: "Terminal command" }).fill("cd ~");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
});

test("404 page has no serious accessibility violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/no-such-page");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
});
