import type { AddEventListener } from "../event";

const SEND: unique symbol = /*#__PURE__*/ Symbol.for("send");

interface AddEventListenerImpl<T> extends AddEventListener<T> {
  listeners_?: Array<((data: T) => void) | undefined> | ((data: T) => void);
}

export const sparseArray = <T = void>(): AddEventListener<T> => {
  let size = 0;
  let isArray = false;

  function on(this: AddEventListenerImpl<T>, fn: (data: T) => void) {
    if (!this.listeners_) {
      this.listeners_ = fn;
      size = 1;
    } else if (size === 1) {
      this.listeners_ = [this.listeners_ as (data: T) => void, fn];
      size = 2;
      isArray = true;
    } else {
      (this.listeners_ as Array<(data: T) => void>).push(fn);
      size++;
    }
  }

  function off(this: AddEventListenerImpl<T>, fn: (data: T) => void) {
    if (!this.listeners_) {
      return;
    }

    if (size === 1) {
      this.listeners_ = undefined;
      size = 0;
      return;
    }

    const listeners = this.listeners_ as Array<((data: T) => void) | undefined>;
    const index = listeners.indexOf(fn);
    if (index >= 0) {
      listeners[index] = undefined;
      size--;

      if (size * 2 < listeners.length) {
        let n = 0;
        for (let i = 0; i < listeners.length; i++) {
          if (listeners[i]) {
            listeners[n++] = listeners[i];
          }
        }
        listeners.length = n;
      }
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
    } else if (!isArray) {
      (this.listeners_ as (data: T) => void)(data);
    } else {
      for (const fn of this.listeners_ as Array<(data: T) => void>) {
        if (fn) invoke(fn, data);
      }
    }
  }

  function dispose(this: AddEventListenerImpl<T>) {
    this.listeners_ = undefined;
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
