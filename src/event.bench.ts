/* eslint-disable @typescript-eslint/no-explicit-any */

// Optimize "single listener" case, source from VS Code:
// https://github.com/microsoft/vscode/blob/541f878/src/vs/base/common/event.ts#L1039-L1041

import { bench } from "vitest";

import { event, send } from "./event";

const optimized = <T = void>() => {
  function on(this: any, fn: (data: T) => void) {
    if (this.listeners_ == null) {
      this.listeners_ = fn;
    } else if (this.listeners_ instanceof Function) {
      this.listeners_ = [this.listeners_, fn];
    } else {
      this.listeners_.push(fn);
    }
  }

  function off(this: any, fn: (data: T) => void) {
    if (this.listeners_ === fn) {
      this.listeners_ = null;
    } else if (this.listeners_) {
      const idx = this.listeners_.indexOf(fn);
      if (idx >= 0) {
        // Use a sparse array because VS Code does this too.
        this.listeners_[idx] = undefined;
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

  function send(this: any, data: T) {
    if (this.listeners_ == null) {
      return;
    } else if (this.listeners_ instanceof Function) {
      this.listeners_(data);
    } else {
      for (const fn of this.listeners_) {
        if (fn) invoke(fn, data);
      }
    }
  }

  function dispose(this: any) {
    this.listeners_ = null;
  }

  function addEventListener(fn: (data: T) => void) {
    on.call(addEventListener, fn);
    return () => (addEventListener as any).off(fn);
  }
  addEventListener.off = off;
  addEventListener.send = send;
  addEventListener.dispose = dispose;

  return addEventListener;
};

bench("current - construct", () => {
  event();
});
bench("optimized - construct", () => {
  optimized();
});

{
  const onA = event();
  bench("current - add", () => {
    onA(() => {});
  });
}

{
  const onB = optimized();
  bench("optimized - add", () => {
    onB(() => {});
  });
}

{
  const onA = event();
  bench("current - add and remove", () => onA(() => {})());
}

{
  const onB = optimized();
  bench("optimized - add and remove", () => onB(() => {})());
}

{
  const onA = event();
  bench("current - send empty", () => {
    send(onA);
  });
}

{
  const onB = optimized();
  bench("optimized - send empty", () => {
    onB.send();
  });
}

{
  const onA = event();
  onA(() => {});
  bench("current - send 1", () => {
    send(onA);
  });
}

{
  const onB = optimized();
  onB(() => {});
  bench("optimized - send 1", () => {
    onB.send();
  });
}

{
  const onA = event();
  for (let i = 0; i < 10; i++) {
    onA(() => {});
  }
  bench("current - send 10", () => {
    send(onA);
  });
}

{
  const onB = optimized();
  for (let i = 0; i < 10; i++) {
    onB(() => {});
  }
  bench("optimized - send 10", () => {
    onB.send();
  });
}
