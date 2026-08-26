import { describe, expect, test } from "bun:test";
import { analyzeLogic } from "./analyze.ts";
import { parseView } from "./parseView.ts";
import { validateBindings } from "./validate.ts";

const L = (code: string) => analyzeLogic(code);
const V = (html: string) => parseView(html);

// A logic module exposing one signal, one computed, and one action.
const FULL = L(`
import { signal, computed } from "./r";
export const count = signal(0);
export const items = signal([]);
export const double = computed(() => count.value * 2);
export function increment() { count.value++; }
`);

describe("validateBindings — Article V (No Magic, Only Contracts)", () => {
  test("passes when every binding is exported by logic", () => {
    const v = V(`
<p>{{ count }} / {{ double }}</p>
<button ax-on:click="increment">+</button>
<li ax-for="item in items">{{ item }}</li>
<input ax-model="count" />
`);
    expect(() => validateBindings(v, FULL)).not.toThrow();
  });

  test("THROWS when a mustache references an undeclared symbol", () => {
    const v = V(`<p>{{ mystery }}</p>`);
    expect(() => validateBindings(v, FULL)).toThrow(/CONTRACT VIOLATION/);
  });

  test("THROWS when an event handler is not an action", () => {
    const v = V(`<button ax-on:click="count">+</button>`);
    expect(() => validateBindings(v, FULL)).toThrow(/expects an action/);
  });

  test("THROWS when ax-for source is not reactive", () => {
    const v = V(`<li ax-for="x in increment">{{ x }}</li>`);
    expect(() => validateBindings(v, FULL)).toThrow(/requires "increment"/);
  });

  test("THROWS when ax-model targets a non-writable signal", () => {
    const v = V(`<input ax-model="double" />`);
    expect(() => validateBindings(v, FULL)).toThrow(/writable signal/);
  });
});

describe("validateBindings — Article I (No logic in the View)", () => {
  test("THROWS when a directive value is an expression, not a bare identifier", () => {
    const v = V(`<span ax-if="count > 0">x</span>`);
    expect(() => validateBindings(v, FULL)).toThrow(/bare identifier/);
  });
});
