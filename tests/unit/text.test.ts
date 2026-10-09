import { describe, expect, it } from "vitest";

import { split } from "@/features/motion/text";

describe("split", () => {
  it("wraps words and characters and keeps one screen-reader copy", () => {
    const el = document.createElement("h2");
    el.innerHTML = "Hello <b>big</b> world";
    const { chars, words } = split(el);
    expect(words).toHaveLength(3);
    expect(chars.map((c) => c.textContent).join("")).toBe("Hellobigworld");
    expect(el.querySelector(".sr")?.textContent).toBe("Hello big world");
    expect(el.querySelector("[aria-hidden]")).not.toBeNull();
  });

  it("is idempotent", () => {
    const el = document.createElement("span");
    el.textContent = "Two words";
    const first = split(el);
    const again = split(el);
    expect(again.chars).toHaveLength(first.chars.length);
    expect(el.querySelectorAll(".sr")).toHaveLength(1);
  });
});
