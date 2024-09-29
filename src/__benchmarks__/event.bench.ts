/* eslint-disable @typescript-eslint/no-explicit-any */

// Optimize "single listener" case, source from VS Code:
// https://github.com/microsoft/vscode/blob/541f878/src/vs/base/common/event.ts#L1039-L1041

import type { AddEventListener } from "../event";

import { bench, describe } from "vitest";

import { event, send } from "../event";
import { lazySet } from "./lazy-set";
import { sparseArray } from "./sparse-array";

const benchBoth = setupBenchBoth();

describe("construct", () => {
  bench("event", () => {
    event();
  });
  bench("lazy-set", () => {
    lazySet();
  });
  bench("sparse-array", () => {
    sparseArray();
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
    type: "event" | "lazy-set" | "sparse-array",
    fn: (on: AddEventListener<T>) => void,
    setup?: (on: AddEventListener<T>) => void
  ) => {
    const benchMethod = method ? bench[method] : bench;
    let on: AddEventListener<T> | undefined;
    benchMethod(type, () => fn(on as AddEventListener<T>), {
      setup() {
        on =
          type === "event"
            ? event()
            : type === "lazy-set"
            ? lazySet()
            : sparseArray();
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
        benchEach(method, "lazy-set", fn, setup);
        benchEach(method, "sparse-array", fn, setup);
      });
    };

  const benchBoth = createBenchBoth() as BenchBoth;
  benchBoth.only = createBenchBoth("only");
  benchBoth.skip = createBenchBoth("skip");
  benchBoth.todo = createBenchBoth("skip");

  return benchBoth;
}
