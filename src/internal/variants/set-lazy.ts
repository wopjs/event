import type { AddEventListener, Listener } from "../../interface";

import { invoke, SEND } from "../shared";

type Multi<T = void> = Set<Listener<T>>;
type Single<T = void> = Listener<T> | undefined | null;

interface AddEventListenerImpl<T> extends AddEventListener<T> {
  listeners_?: Multi<T> | Single<T>;
  isMulti_?: boolean;
}

interface AddEventListenerImplDev<T> extends AddEventListenerImpl<T> {
  _eventDisposed_?: Error;
}

function send<T = void>(this: AddEventListenerImpl<T>, data: T): void {
  if (process.env.NODE_ENV !== "production") {
    if ((this as AddEventListenerImplDev<T>)._eventDisposed_) {
      console.error(
        new Error("[@wopjs/event:dev] Cannot send. Already disposed.")
      );
      console.error((this as AddEventListenerImplDev<T>)._eventDisposed_);
    }
  }
  if (this.isMulti_) {
    for (const listener of this.listeners_ as Multi<T>) {
      invoke(listener, data);
    }
  } else if (this.listeners_) {
    invoke(this.listeners_ as Listener<T>, data);
  }
}

function size<T = void>(this: AddEventListenerImpl<T>): number {
  return !this.listeners_
    ? 0
    : !this.isMulti_
      ? 1
      : (this.listeners_ as Multi).size;
}

function on<T = void>(
  this: AddEventListenerImpl<T>,
  listener: Listener<T>
): () => void {
  if (!this.listeners_) {
    this.listeners_ = listener;
  } else if (this.isMulti_) {
    (this.listeners_ as Multi<T>).add(listener);
  } else {
    this.listeners_ = new Set([this.listeners_ as Listener<T>, listener]);
    this.isMulti_ = true;
  }
  return () => this.off(listener);
}

function off<T = void>(
  this: AddEventListenerImpl<T>,
  listener?: Listener<T>
): boolean {
  let found = false;
  if (listener) {
    if (this.isMulti_) {
      found = (this.listeners_ as Multi<T>).delete(listener);
    } else if ((found = this.listeners_ === listener)) {
      this.listeners_ = null;
    }
  } else if ((found = this.size() > 0)) {
    this.listeners_ = null;
    this.isMulti_ = false;
  }
  return found;
}

function dispose<T = void>(this: AddEventListenerImpl<T>): void {
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
    return addEventListener.on(listener);
  }
  addEventListener.size = size;
  addEventListener.on = on;
  addEventListener.off = off;
  addEventListener.dispose = dispose;
  addEventListener[SEND] = send;
  return addEventListener;
};
