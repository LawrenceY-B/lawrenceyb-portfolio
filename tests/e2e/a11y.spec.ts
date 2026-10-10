import AxeBuilder from "@axe-core/playwright";

import { expect, mockMarket, test } from "./fixtures";

test.use({ reducedMotion: "reduce" });

for (const scheme of ["light", "dark"] as const) {
  test(`no serious accessibility violations (${scheme})`, async ({ page }) => {
    await mockMarket(page);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("region", { name: /Ghana market data/ })).toContainText("● Live");
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
}

for (const slug of ["trade-sim", "treasury-bills-api", "friendwave"]) {
  for (const scheme of ["light", "dark"] as const) {
    test(`case study ${slug} has no serious accessibility violations (${scheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(`/work/${slug}`);
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
  }
}

test("API response tabs switch with the arrow keys", async ({ page }) => {
  await page.goto("/work/treasury-bills-api");
  const first = page.getByRole("tab", { name: "T-bills" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Stock" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText('"symbol": "MTNGH"');
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "Insights" })).toBeFocused();
});
