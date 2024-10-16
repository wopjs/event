import type { AddEventListener, Listener } from "../../interface";

import { invoke, SEND } from "../shared";

interface AddEventListenerImpl<T> extends AddEventListener<T> {
  listeners_: Set<Listener<T>>;
}

interface AddEventListenerImplDev<T> extends AddEventListenerImpl<T> {
  _eventDisposed_?: Error;
}

function send<T>(this: AddEventListenerImpl<T>, data: T): void {
  if (process.env.NODE_ENV !== "production") {
    if ((this as AddEventListenerImplDev<T>)._eventDisposed_) {
      console.error(
        new Error("[@wopjs/event:dev] Cannot send. Already disposed.")
      );
      console.error((this as AddEventListenerImplDev<T>)._eventDisposed_);
    }
  }
  for (const listener of this.listeners_) {
    invoke(listener, data);
  }
}

function size<T>(this: AddEventListenerImpl<T>): number {
  return this.listeners_.size;
}

function off<T>(
  this: AddEventListenerImpl<T>,
  listener?: Listener<T>
): boolean {
  let found = false;
  if (listener) {
    found = this.listeners_.delete(listener);
  } else if ((found = this.listeners_.size > 0)) {
    this.listeners_.clear();
  }
  return found;
}

function dispose<T>(this: AddEventListenerImpl<T>): void {
  if (process.env.NODE_ENV !== "production") {
    (this as AddEventListenerImplDev<T>)._eventDisposed_ = new Error(
      "[@wopjs/event:dev] Disposed at:"
    );
  }
  this.off();
}

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
  function addEventListener(listener: Listener<T>): () => void {
    addEventListener.listeners_.add(listener);
    return () => addEventListener.off(listener);
  }
  addEventListener.listeners_ = new Set<Listener<T>>();
  addEventListener.size = size;
  addEventListener.off = off;
  addEventListener.dispose = dispose;
  addEventListener[SEND] = send;
  return addEventListener;
};
