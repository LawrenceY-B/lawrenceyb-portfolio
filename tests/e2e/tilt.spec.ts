import { expect, mockMarket, test } from "./fixtures";

const toggle = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Tilt the particles with your phone" });

test.describe("on a phone with motion sensors allowed", () => {
  // Chrome on Android allows motion sensors by default; test browsers grant nothing unless told.
  test.use({ permissions: ["accelerometer", "gyroscope"] });

  test("phone tilt is on by default and the choice sticks", async ({ page, errors }) => {
    test.skip(test.info().project.name !== "mobile", "touch devices only");
    await mockMarket(page);
    await page.goto("/work/edusearch");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    await page.evaluate(() =>
      window.dispatchEvent(
        new DeviceOrientationEvent("deviceorientation", { beta: 70, gamma: 20 }),
      ),
    );
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
    await page.reload();
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
    expect(errors).toEqual([]);
  });
});

test("no tilt toggle with a mouse", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "mouse devices only");
  await page.goto("/work/edusearch");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(toggle(page)).toHaveCount(0);
});
