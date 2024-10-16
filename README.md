# @wopjs/event

[![Docs](https://img.shields.io/badge/Docs-read-%23fdf9f5)](https://wopjs.github.io/event)
[![Build Status](https://github.com/wopjs/event/actions/workflows/build.yml/badge.svg)](https://github.com/wopjs/event/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/@wopjs/event.svg)](https://www.npmjs.com/package/@wopjs/event)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/wopjs/event)](https://coveralls.io/github/wopjs/event)
[![minified-size](https://img.shields.io/bundlephobia/minzip/@wopjs/event)](https://bundlephobia.com/package/@wopjs/event)

A tiny utility to create an event that can be subscribed to.

## Install

```
npm add @wopjs/event
```

## Usage

```ts
import { event, send } from "@wopjs/event";

const onDidChange = event<string>();
const dispose = onDidChange(data => console.log(data));

send(onDidChange, "data"); // logs "data"
dispose();
```

## Patterns

In general, you would export the event directly (which is the `AddEventListener` type) and send it from the class that owns it.

```ts
// module-a.ts

import { event, send } from "@wopjs/event";
import { disposableStore } from "@wopjs/disposable";

export class A {
  public readonly dispose = disposableStore();

  public readonly onStatusDidChange = event<string>();

  public constructor() {
    this.dispose.add(this.onStatusDidChange);

    this.dispose.add(
      onOtherEvent(() => {
        send(this.onStatusDidChange, "loading");
      })
    );
  }
}
```

Other modules can then subscribe to the event, but generally not send it.

```ts
// module-b.ts

import type { A } from "./module-a";
import { event, send } from "@wopjs/event";
import { disposableStore } from "@wopjs/disposable";

export class B {
  public readonly dispose = disposableStore();

  public constructor(a: A) {
    this.dispose.add(
      a.onStatusDidChange(status => {
        console.log(status);
      })
    );
  }
}
```

You can also let `module-b` depend only on the event itself so that it does not need to import `module-a` (hence more "pure").

In this case generally you would use the simpler `IEvent` type to define the event.

```ts
// module-b.ts

import { event, send, IEvent } from "@wopjs/event";
import { disposableStore } from "@wopjs/disposable";

export class B {
  public readonly dispose = disposableStore();

  public constructor(onAStatusDidChange: IEvent<string>) {
    this.dispose.add(
      onAStatusDidChange(status => {
        console.log(status);
      })
    );
  }
}
```

If you need to let other modules send the event, it is recommended to expose a dedicated method for that.

```ts
// module-a.ts

import { event, send } from "@wopjs/event";
import { disposableStore } from "@wopjs/disposable";

export class A {
  public readonly dispose = disposableStore();

  public readonly onStatusDidChange = event<string>();

  public constructor() {
    this.dispose.add(onStatusDidChange);
  }

  public changeStatus(status: string) {
    send(this.onStatusDidChange, status);
  }
}
```

## License

MIT @ [wopjs](https://github.com/wopjs)
