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

## License

MIT @ [wopjs](https://github.com/wopjs)
