import type { AddEventListener, Listener } from "../../interface";

import { invoke, SEND } from "../shared";

type Multi<T = void> = Set<Listener<T>>;
type Single<T = void> = Listener<T> | undefined | null;

interface AddEventListenerImpl<T> extends AddEventListener<T> {
  listeners_?: Multi<T> | Single<T>;
  isMulti_?: boolean;
}

function send<T = void>(this: AddEventListenerImpl<T>, data: T): void {
  if (this.isMulti_) {
    for (const listener of this.listeners_ as Multi<T>) {
      invoke(listener, data);
    }
  } else if (this.listeners_) {
    invoke(this.listeners_ as Listener<T>, data);
  }
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
  listener: Listener<T>
): void {
  if (this.isMulti_) {
    (this.listeners_ as Multi<T>).delete(listener);
  } else {
    (this.listeners_ as Single<T>) = null;
  }
}

function dispose<T = void>(this: AddEventListenerImpl<T>): void {
  this.listeners_ = null;
  this.isMulti_ = false;
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
    on.call<AddEventListenerImpl<T>, [Listener<T>], void>(
      addEventListener,
      listener
    );
    return () => addEventListener.off(listener);
  }
  addEventListener.off = off;
  addEventListener.dispose = dispose;
  addEventListener[SEND] = send;
  return addEventListener;
};
