import type { AddEventListener } from "./event";

import { event, send } from "./event";

interface FromImpl extends AddEventListener<unknown> {
  dispose_(): void;
}

/**
 * Create an event listener from an external event source.
 * The `init()` function will be called immediately.
 * The `notify()` function is used to emit data to the event listener.
 */
export const from = <T = void>(
  init: (notify: (data: T) => void) => (() => void) | void
): AddEventListener<T> => {
  const e = event<T>();
  const stop = init(data => send(e, data));

  if (typeof stop === "function") {
    (e as FromImpl).dispose_ = e.dispose;
    e.dispose = function dispose() {
      stop();
      (this as FromImpl).dispose_();
    };
  }

  return e;
};
