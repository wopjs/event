import { vi, describe, expect, it } from "vitest";

import { event, send } from "./index";

describe("event", () => {
  it("should work with void", () => {
    const onDidChange = event();
    expect(onDidChange).toBeDefined();

    const fn = vi.fn();
    onDidChange(fn);
    send(onDidChange);
    expect(fn).toHaveBeenCalled();

    onDidChange.dispose();
    send(onDidChange);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should work with data", () => {
    const onDidChange = event<string>();
    expect(onDidChange).toBeDefined();

    const fn = vi.fn();
    const dispose = onDidChange(fn);
    send(onDidChange, "data");
    expect(fn).toHaveBeenCalledWith("data");

    dispose();
    send(onDidChange, "data");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should work with multiple listeners", () => {
    const onDidChange = event<string>();
    expect(onDidChange).toBeDefined();

    const fn1 = vi.fn();
    onDidChange(fn1);
    const fn2 = vi.fn();
    onDidChange(fn2);

    send(onDidChange, "data");
    expect(fn1).toHaveBeenCalledWith("data");
    expect(fn2).toHaveBeenCalledWith("data");

    onDidChange.off(fn1);
    send(onDidChange, "data");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);

    onDidChange.off(fn2);
    send(onDidChange, "data");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
  });

  it("should handle throw error", () => {
    const consoleErrorMock = vi
      .spyOn(console, "error")
      .mockImplementation(() => void 0);

    const onDidChange = event();
    onDidChange(() => {
      throw new Error("error");
    });
    expect(consoleErrorMock).not.toBeCalled();

    send(onDidChange);

    expect(consoleErrorMock).toBeCalled();
    consoleErrorMock.mockRestore();
  });
});
