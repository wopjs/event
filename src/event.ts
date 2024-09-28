const SEND: unique symbol = /*#__PURE__*/ Symbol.for("send");

/** Generic type for `onSomeEvent`, which is a function itself. */
export interface IEvent<T = void> {
  /** Adds listener, returns a dispose function. */
  (listener: (data: T) => void): () => void;
}

/** The return value of `event()`. */
export interface AddEventListener<T = void> extends IEvent<T> {
  /** Removes listener. */
  off(listener: (data: T) => void): void;
  /** Removes all listeners. */
  dispose(): void;

  [SEND](data: T): void;
}

interface AddEventListenerImpl<T> extends AddEventListener<T> {
  listeners_: Set<(data: T) => void>;
}

const invoke = <T>(fn: (data: T) => void, data: T) => {
  try {
    fn(data);
  } catch (e) {
    console.error(e);
  }
};

const methods = {
  [SEND]<T>(this: AddEventListenerImpl<T>, data: T) {
    for (const fn of this.listeners_) {
      invoke(fn, data);
    }
  },
  off<T>(this: AddEventListenerImpl<T>, fn: (data: T) => void) {
    this.listeners_.delete(fn);
  },
  dispose<T>(this: AddEventListenerImpl<T>) {
    this.listeners_.clear();
  },
};

/**
 * Create an event that can be subscribed to, which is the function itself.
 *
 * @example
 * ```ts
 * import { event, send } from "@wopjs/event";
 * const onDidChange = event<string>();
 * const dispose = onDidChange((data) => console.log(data));
 * send(onDidChange, "data")
 * ```
 */
export const event = <T = void>(): AddEventListener<T> => {
  function addEventListener(fn: (data: T) => void): () => void {
    addEventListener.listeners_.add(fn);
    return () => (addEventListener as unknown as AddEventListener<T>).off(fn);
  }
  addEventListener.listeners_ = new Set();
  return Object.assign(addEventListener, methods);
};

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