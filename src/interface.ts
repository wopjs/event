import type { SEND } from "./internal/shared";

export interface Listener<T = void> {
  (data: T): void;
}

/** Generic type for `onSomeEvent`, which is a function itself. */
export interface IEvent<T = void> {
  /**
   * Adds a listener to the event.
   * @param listener The callback to add.
   * @returns A function to remove the listener.
   */
  (listener: Listener<T>): () => void;
}

/** The return value of `event()`. */
export interface AddEventListener<T = void> extends IEvent<T> {
  /**
   * @returns Size of listeners.
   */
  size(): number;
  /**
   * Adds a listener to the event.
   * @param listener The callback to add.
   * @returns A function to remove the listener.
   */
  on(listener: Listener<T>): () => void;
  /**
   * Removes a listener from the event.
   * @param listener The callback to remove. If omitted, all listeners are removed.
   * @returns Whether the listener was found and removed.
   */
  off(listener?: Listener<T>): boolean;

  dispose(): void;

  /**
   * @internal
   */
  [SEND](data: T): void;
}
