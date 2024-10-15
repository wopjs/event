import { vi, describe, expect, it } from "vitest";

import { event as eventSetLazy } from "./internal/variants/set-lazy";
import { event as eventSetSimple } from "./internal/variants/set-simple";
import { event as eventSparseArrayLazy } from "./internal/variants/sparse-array-lazy";
import { send } from "./send";

const cases = [
  { name: "set-simple", event: eventSetSimple },
  { name: "set-lazy", event: eventSetLazy },
  { name: "sparse-array-lazy", event: eventSparseArrayLazy },
];

describe.each(cases)("$name", ({ event }) => {
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
    const fn3 = vi.fn();
    onDidChange(fn3);

    send(onDidChange, "data");
    expect(fn1).toHaveBeenCalledWith("data");
    expect(fn2).toHaveBeenCalledWith("data");
    expect(fn3).toHaveBeenCalledWith("data");

    onDidChange.off(fn1);
    send(onDidChange, "data");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
    expect(fn3).toHaveBeenCalledTimes(2);

    onDidChange.off(fn2);
    send(onDidChange, "data");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
    expect(fn3).toHaveBeenCalledTimes(3);

    onDidChange.off(fn3);
    send(onDidChange, "data");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
    expect(fn3).toHaveBeenCalledTimes(3);
  });

  it("should remove listener", () => {
    const onDidChange = event<string>();
    expect(onDidChange).toBeDefined();

    const fn1 = vi.fn();
    onDidChange(fn1);
    const fn2 = vi.fn();
    onDidChange(fn2);
    const fn3 = vi.fn();
    onDidChange(fn3);

    expect(onDidChange.size()).toBe(3);

    expect(onDidChange.off(fn1)).toBe(true);

    expect(onDidChange.size()).toBe(2);

    send(onDidChange, "data");
    expect(fn1).toBeCalledTimes(0);
    expect(fn2).toBeCalledTimes(1);
    expect(fn3).toBeCalledTimes(1);

    fn2.mockClear();
    fn3.mockClear();

    expect(onDidChange.off(fn2)).toBe(true);

    expect(onDidChange.size()).toBe(1);

    send(onDidChange, "data");
    expect(fn1).toBeCalledTimes(0);
    expect(fn2).toBeCalledTimes(0);
    expect(fn3).toBeCalledTimes(1);

    fn3.mockClear();

    expect(onDidChange.off(() => void 0)).toBe(false);

    expect(onDidChange.size()).toBe(1);

    send(onDidChange, "data");
    expect(fn1).toBeCalledTimes(0);
    expect(fn2).toBeCalledTimes(0);
    expect(fn3).toBeCalledTimes(1);

    fn3.mockClear();

    expect(onDidChange.off(fn3)).toBe(true);

    expect(onDidChange.size()).toBe(0);

    send(onDidChange, "data");
    expect(fn1).toBeCalledTimes(0);
    expect(fn2).toBeCalledTimes(0);
    expect(fn3).toBeCalledTimes(0);
  });

  it("should remove all listeners", () => {
    const onDidChange = event<string>();
    expect(onDidChange).toBeDefined();

    const fn1 = vi.fn();
    onDidChange(fn1);
    const fn2 = vi.fn();
    onDidChange(fn2);
    const fn3 = vi.fn();
    onDidChange(fn3);

    expect(onDidChange.size()).toBe(3);

    expect(onDidChange.off()).toBe(true);

    expect(onDidChange.size()).toBe(0);

    send(onDidChange, "data");
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
    expect(fn3).not.toHaveBeenCalled();

    expect(onDidChange.off()).toBe(false);
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
