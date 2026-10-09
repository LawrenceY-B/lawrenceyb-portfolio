import { beforeEach, describe, expect, it, vi } from "vitest";

import { ui, watch } from "@/lib/store";

const initial = ui.getState();

describe("ui store", () => {
  beforeEach(() => ui.setState(initial, true));

  it("calls watchers when their key changes, until unsubscribed", () => {
    const fn = vi.fn();
    const off = watch("hoveredShape", fn);
    ui.setState({ hoveredShape: 5 });
    off();
    ui.setState({ hoveredShape: null });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(5);
  });

  it("ignores other keys and unchanged values", () => {
    const fn = vi.fn();
    const off = watch("theme", fn);
    ui.setState({ inspect: true });
    ui.setState({ theme: "light" });
    off();
    expect(fn).not.toHaveBeenCalled();
  });
});
