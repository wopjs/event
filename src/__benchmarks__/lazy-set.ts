import type { AddEventListener } from "../event";

const SEND: unique symbol = /*#__PURE__*/ Symbol.for("send");

interface AddEventListenerImpl<T> extends AddEventListener<T> {
  listeners_?: Set<(data: T) => void> | ((data: T) => void);
}

export const lazySet = <T = void>(): AddEventListener<T> => {
  let isSet = false;

  function on(this: AddEventListenerImpl<T>, fn: (data: T) => void) {
    if (!this.listeners_) {
      this.listeners_ = fn;
    } else if (!isSet) {
      this.listeners_ = new Set([this.listeners_ as (data: T) => void, fn]);
      isSet = true;
    } else {
      (this.listeners_ as Set<(data: T) => void>).add(fn);
    }
  }

  function off(this: AddEventListenerImpl<T>, fn: (data: T) => void) {
    if (this.listeners_ === fn) {
      this.listeners_ = undefined;
    } else if (isSet) {
      (this.listeners_ as Set<(data: T) => void>).delete(fn);
    }
  }

  const invoke = <T>(fn: (data: T) => void, data: T) => {
    try {
      fn(data);
    } catch (e) {
      console.error(e);
    }
  };

  function send(this: AddEventListenerImpl<T>, data: T) {
    if (!this.listeners_) {
      return;
    } else if (!isSet) {
      (this.listeners_ as (data: T) => void)(data);
    } else {
      for (const fn of this.listeners_ as Set<(data: T) => void>) {
        invoke(fn, data);
      }
    }
  }

  function dispose(this: AddEventListenerImpl<T>) {
    this.listeners_ = undefined;
    isSet = false;
  }

  const addEventListener = function addEventListener(fn: (data: T) => void) {
    on.call(addEventListener as AddEventListener<T>, fn);
    return () => (addEventListener as AddEventListener<T>).off(fn);
  } as AddEventListener<T>;

  addEventListener.off = off;
  addEventListener.dispose = dispose;
  (addEventListener as unknown as { [SEND](data: T): void })[SEND] = send;

  return addEventListener;
};
