import type { Listener } from "../interface";

export const SEND: unique symbol = /*#__PURE__*/ Symbol.for("send");

export const invoke = <T>(fn: Listener<T>, data: T): void => {
  try {
    fn(data);
  } catch (e) {
    console.error(e);
  }
};
