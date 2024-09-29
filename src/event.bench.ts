/* eslint-disable @typescript-eslint/no-explicit-any */

// Optimize "single listener" case, source from VS Code:
// https://github.com/microsoft/vscode/blob/541f878/src/vs/base/common/event.ts#L1039-L1041

import type { AddEventListener } from "./interface";

import { bench, describe } from "vitest";

import { event as eventSetLazy } from "./internal/variants/set-lazy";
import { event as eventSetSimple } from "./internal/variants/set-simple";
import { event as eventSparseArrayLazy } from "./internal/variants/sparse-array-lazy";
import { send } from "./send";

const cases = [
  { name: "set-simple", event: eventSetSimple },
  { name: "set-lazy", event: eventSetLazy },
  { name: "sparse-array-lazy", event: eventSparseArrayLazy },
];

const benchVariants = setupBenchVariants(cases);

describe("construct", () => {
  for (const { name, event } of cases) {
    bench(name, () => {
      event();
    });
  }
});

benchVariants("add 1", on => on(() => {}));

benchVariants("add 1 then remove 1", on => on(() => {})());

benchVariants("add 5 then remove 5", on => {
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

benchVariants("add 5 then remove 3 then add 5", on => {
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

benchVariants("send with 0 listener", on => send(on));

benchVariants(
  "send with 1 listener",
  on => send(on),
  on => on(() => {})
);

benchVariants(
  "send with 10 listeners",
  on => send(on),
  on => {
    for (let i = 0; i < 10; i++) {
      on(() => {});
    }
  }
);

function setupBenchVariants(
  cases: Array<{ name: string; event: <T = void>() => AddEventListener<T> }>
) {
  const benchVariant = <T = void>(
    method: "skip" | "only" | "todo" | undefined,
    type: string,
    fn: (on: AddEventListener<T>) => void,
    setup?: (on: AddEventListener<T>) => void
  ) => {
    const benchMethod = method ? bench[method] : bench;
    let on: AddEventListener<T> | undefined;
    benchMethod(type, () => fn(on as AddEventListener<T>), {
      setup() {
        on = cases.find(item => item.name === type)!.event();
        setup?.(on);
      },
      teardown() {
        on = void on?.dispose();
      },
    });
  };

  interface BenchVariantsBase {
    <T = void>(
      name: string,
      fn: (on: AddEventListener<T>) => void,
      setup?: (on: AddEventListener<T>) => void
    ): void;
  }

  interface BenchVariants extends BenchVariantsBase {
    only: BenchVariantsBase;
    skip: BenchVariantsBase;
    todo: BenchVariantsBase;
  }

  const createBenchVariants =
    (method?: "skip" | "only" | "todo"): BenchVariantsBase =>
    (name, fn, setup) => {
      describe(name, () => {
        for (const { name } of cases) {
          benchVariant(method, name, fn, setup);
        }
      });
    };

  const benchBoth = createBenchVariants() as BenchVariants;
  benchBoth.only = createBenchVariants("only");
  benchBoth.skip = createBenchVariants("skip");
  benchBoth.todo = createBenchVariants("skip");

  return benchBoth;
}
