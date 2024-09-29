import type { IEvent, AddEventListener } from "./interface";

import { SEND } from "./internal/shared";

export interface Send {
  (event: AddEventListener<void | undefined | never>, data?: undefined): void;
  <T>(event: AddEventListener<T>, data: T): void;
}

/**
 * Emit an event to `onSomeEvent`.
 * It silently fail if the input is not created by `event()`.
 *
 * @example
 * ```ts
 * import { event, send } from "@wopjs/event";
 * const onDidChange = event<string>();
 * send(onDidChange, "data")
 * ```
 */
export const send: Send = <T>(event: IEvent<T>, data?: T) =>
  (event as AddEventListener<T>)?.[SEND]?.(data as T);
