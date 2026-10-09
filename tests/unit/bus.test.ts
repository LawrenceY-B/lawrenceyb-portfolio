import { describe, expect, it, vi } from "vitest";

import { emit, on } from "@/lib/bus";

describe("bus", () => {
  it("delivers payloads until unsubscribed", () => {
    const fn = vi.fn();
    const off = on("project-hover", fn);
    emit("project-hover", 5);
    off();
    emit("project-hover", null);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(5);
  });
});
