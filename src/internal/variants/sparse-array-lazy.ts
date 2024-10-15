import type { AddEventListener, Listener } from "../../interface";

import { invoke, SEND } from "../shared";

type Multi<T = void> = Array<Listener<T> | undefined>;
type Single<T = void> = Listener<T> | undefined | null;

interface AddEventListenerImpl<T> extends AddEventListener<T> {
  listeners_?: Multi<T> | Single<T>;
  isMulti_?: boolean;
  size_: number;
}

function send<T = void>(this: AddEventListenerImpl<T>, data: T): void {
  if (this.isMulti_) {
    for (const listener of this.listeners_ as Multi<T>) {
      if (listener) invoke(listener, data);
    }
  } else if (this.listeners_) {
    invoke(this.listeners_ as Listener<T>, data);
  }
}

function size<T = void>(this: AddEventListenerImpl<T>): number {
  return this.size_;
}

function on<T = void>(
  this: AddEventListenerImpl<T>,
  listener: Listener<T>
): () => void {
  if (!this.listeners_) {
    this.listeners_ = listener;
    this.size_ = 1;
  } else if (this.isMulti_) {
    (this.listeners_ as Multi<T>)[this.size_++] = listener;
  } else {
    this.listeners_ = [this.listeners_ as Listener<T>, listener];
    this.size_ = 2;
    this.isMulti_ = true;
  }
  return () => this.off(listener);
}

function off<T = void>(
  this: AddEventListenerImpl<T>,
  listener?: Listener<T>
): void {
  if (listener) {
    if (this.isMulti_) {
      const listeners = this.listeners_ as Multi<T>;
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners[index] = undefined;
        this.size_--;

        if (this.size_ * 2 < listeners.length) {
          let len = 0;
          for (let i = 0; i < listeners.length; i++) {
            if (listeners[i]) {
              listeners[len++] = listeners[i];
            }
          }
          listeners.length = len;
        }
      }
    } else {
      (this.listeners_ as Single<T>) = null;
      this.size_ = 0;
    }
  } else {
    this.listeners_ = null;
    this.isMulti_ = false;
    this.size_ = 0;
  }
}

function dispose<T = void>(this: AddEventListenerImpl<T>): void {
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
    on.call<AddEventListenerImpl<T>, [Listener<T>], void>(
      addEventListener,
      listener
    );
    return () => addEventListener.off(listener);
  }
  addEventListener.size_ = 0;
  addEventListener.size = size;
  addEventListener.off = off;
  addEventListener.dispose = dispose;
  addEventListener[SEND] = send;
  return addEventListener;
};
