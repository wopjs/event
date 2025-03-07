// Optimize "single listener" case, source from VS Code:
// https://github.com/microsoft/vscode/blob/541f878/src/vs/base/common/event.ts#L1039-L1041

import type { AddEventListener } from "./interface";

import { run, bench, summary, group, compact, do_not_optimize } from "mitata";

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

const construct = () => {
  for (const { name, event } of cases) {
    bench(name, event);
  }
};
group("construct", () => compact(() => summary(construct)));

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

await run();

function setupBenchVariants(
  cases: Array<{ name: string; event: <T = void>() => AddEventListener<T> }>
) {
  const benchVariants = <T = void>(
    name: string,
    fn: (on: AddEventListener<T>) => void,
    setup?: (on: AddEventListener<T>) => void
  ) => {
    const task = () => {
      for (const c of cases) {
        bench(c.name, function* () {
          yield {
            [0]() {
              const on = c.event<T>();
              if (setup) setup(on);
              return on;
            },
            bench(on: AddEventListener<T>) {
              return do_not_optimize(fn(on));
            },
          };
        });
      }
    };
    group(name, () => compact(() => summary(task)));
  };

  return benchVariants;
}
