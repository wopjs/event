import type { AddEventListener } from "./event";

import { event, send } from "./event";

export const from = <T = void>(
  init: (notify: (data: T) => void) => void
): AddEventListener<T> => {
  const e = event<T>();
  init(data => send(e, data));
  return e;
};
