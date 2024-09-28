/* eslint-disable @typescript-eslint/no-explicit-any */

// Optimize "single listener" case, source from VS Code:
// https://github.com/microsoft/vscode/blob/541f878/src/vs/base/common/event.ts#L1039-L1041

import type { AddEventListener } from "./event";

import { bench, describe } from "vitest";

import { event, send } from "./event";

const benchBoth = setupBenchBoth();

const SEND: symbol = /*#__PURE__*/ Symbol.for("send");

const optimized = <T = void>(): AddEventListener<T> => {
  function on(this: any, fn: (data: T) => void) {
    if (this.listeners_ == null) {
      this.listeners_ = fn;
    } else if (this.listeners_ instanceof Function) {
      this.listeners_ = [this.listeners_, fn];
    } else {
      this.listeners_.push(fn);
    }
  }

  function off(this: any, fn: (data: T) => void) {
    if (this.listeners_ === fn) {
      this.listeners_ = null;
    } else if (this.listeners_) {
      const idx = this.listeners_.indexOf(fn);
      if (idx >= 0) {
        // Use a sparse array because VS Code does this too.
        this.listeners_[idx] = undefined;
      }
    }
  }

  const invoke = <T>(fn: (data: T) => void, data: T) => {
    try {
      fn(data);
    } catch (e) {
      console.error(e);
    }
  };

  function send(this: any, data: T) {
    if (this.listeners_ == null) {
      return;
    } else if (this.listeners_ instanceof Function) {
      this.listeners_(data);
    } else {
      for (const fn of this.listeners_) {
        if (fn) invoke(fn, data);
      }
    }
  }

  function dispose(this: any) {
    this.listeners_ = null;
  }

  const addEventListener = function addEventListener(fn: (data: T) => void) {
    on.call(addEventListener, fn);
    return () => (addEventListener as any).off(fn);
  } as AddEventListener<T>;

  addEventListener.off = off;
  addEventListener.dispose = dispose;
  (addEventListener as any)[SEND] = send;

  return addEventListener;
};

describe("construct", () => {
  bench("event", () => {
    event();
  });

  bench("optimized", () => {
    optimized();
  });
});

benchBoth("add 1", on => on(() => {}));

benchBoth("add 1 then remove 1", on => on(() => {})());

benchBoth("add 5 then remove 5", on => {
  const dispose1 = on(() => {});
  const dispose2 = on(() => {});
  const dispose3 = on(() => {});
  const dispose4 = on(() => {});
  const dispose5 = on(() => {});
  dispose1();
  dispose2();
  dispose3();
  dispose4();
  dispose5();
});

benchBoth("add 5 then remove 3 then add 5", on => {
  const dispose1 = on(() => {});
  const dispose2 = on(() => {});
  const dispose3 = on(() => {});
  on(() => {});
  on(() => {});
  dispose1();
  dispose2();
  dispose3();
  on(() => {});
  on(() => {});
  on(() => {});
  on(() => {});
  on(() => {});
});

benchBoth("send with 0 listener", on => send(on));

benchBoth(
  "send with 1 listener",
  on => send(on),
  on => on(() => {})
);

benchBoth(
  "send with 10 listeners",
  on => send(on),
  on => {
    for (let i = 0; i < 10; i++) {
      on(() => {});
    }
  }
);

function setupBenchBoth() {
  const benchEach = <T = void>(
    method: "skip" | "only" | "todo" | undefined,
    type: "event" | "optimized",
    fn: (on: AddEventListener<T>) => void,
    setup?: (on: AddEventListener<T>) => void
  ) => {
    const benchMethod = method ? bench[method] : bench;
    let on: AddEventListener<T> | undefined;
    benchMethod(type, () => fn(on as AddEventListener<T>), {
      setup() {
        on = type === "event" ? event() : optimized();
        setup?.(on);
      },
      teardown() {
        on = void on?.dispose();
      },
    });
  };

  interface BenchBothPlain {
    <T = void>(
      name: string,
      fn: (on: AddEventListener<T>) => void,
      setup?: (on: AddEventListener<T>) => void
    ): void;
  }

  interface BenchBoth extends BenchBothPlain {
    only: BenchBothPlain;
    skip: BenchBothPlain;
    todo: BenchBothPlain;
  }

  const createBenchBoth =
    (method?: "skip" | "only" | "todo"): BenchBothPlain =>
    (name, fn, setup) => {
      describe(name, () => {
        benchEach(method, "event", fn, setup);
        benchEach(method, "optimized", fn, setup);
      });
    };

  const benchBoth = createBenchBoth() as BenchBoth;
  benchBoth.only = createBenchBoth("only");
  benchBoth.skip = createBenchBoth("skip");
  benchBoth.todo = createBenchBoth("skip");

  return benchBoth;
}
