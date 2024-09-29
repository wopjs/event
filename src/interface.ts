import type { SEND } from "./internal/shared";

export interface Listener<T = void> {
  (data: T): void;
}

/** Generic type for `onSomeEvent`, which is a function itself. */
export interface IEvent<T = void> {
  /** Adds listener, returns a dispose function. */
  (listener: Listener<T>): () => void;
}

/** The return value of `event()`. */
export interface AddEventListener<T = void> extends IEvent<T> {
  /** Removes listener. */
  off(listener: Listener<T>): void;
  /** Removes all listeners. */
  dispose(): void;

  [SEND](data: T): void;
}
