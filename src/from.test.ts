import { val } from "value-enhancer";
import { describe, expect, it, vi } from "vitest";

import { from } from "./from";

describe("from", () => {
  it("should from external event source", () => {
    const content$ = val("", { eager: true });

    const fn = vi.fn();
    const onDidChange = from<string>(notify => content$.subscribe(notify));
    onDidChange(fn);

    content$.set("data");
    expect(fn).toHaveBeenCalledWith("data");
    onDidChange.dispose();

    content$.set("data2");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
