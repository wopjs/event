import type { AddEventListener, Listener } from "../../interface";

import { invoke, SEND } from "../shared";

interface AddEventListenerImpl<T> extends AddEventListener<T> {
  multi_?: Set<Listener<T>> | null;
  single_?: Listener<T> | null;
}

interface AddEventListenerImplDev<T> extends AddEventListenerImpl<T> {
  _eventDisposed_?: Error;
}

function send<T = void>(this: AddEventListenerImpl<T>, data: T): void {
  if (process.env.NODE_ENV !== "production") {
    if ((this as AddEventListenerImplDev<T>)._eventDisposed_) {
      console.error(new Error("[@wopjs/event:dev] Cannot send. Already disposed."));
      console.error((this as AddEventListenerImplDev<T>)._eventDisposed_);
    }
  }
  if (this.multi_) {
    for (const listener of this.multi_) {
      invoke(listener, data);
    }
  } else if (this.single_) {
    invoke(this.single_, data);
  }
}

function size<T = void>(this: AddEventListenerImpl<T>): number {
  return this.multi_ ? this.multi_.size : this.single_ ? 1 : 0;
}

function on<T = void>(this: AddEventListenerImpl<T>, listener: Listener<T>): () => void {
  return (
    this.multi_ || this.single_
      ? (this.single_ = void (this.multi_ ??= new Set<Listener<T>>().add(this.single_!)).add(listener))
      : (this.single_ = listener),
    () => this.off(listener)
  );
}

function off<T = void>(this: AddEventListenerImpl<T>, listener?: Listener<T>): boolean {
  return listener
    ? this.multi_
      ? this.multi_.delete(listener)
      : this.single_ === listener && !(this.single_ = null)
    : this.size() > 0 && !(this.multi_ = this.single_ = null);
}

function dispose<T = void>(this: AddEventListenerImpl<T>): void {
  if (process.env.NODE_ENV !== "production") {
    (this as AddEventListenerImplDev<T>)._eventDisposed_ = new Error("[@wopjs/event:dev] Disposed at:");
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
