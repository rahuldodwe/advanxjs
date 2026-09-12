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

const ORPHAN_ELSE_ERROR =
  "🚨 ADVANXJS CONTRACT VIOLATION: 'ax-else' must be an immediate sibling " +
  "following an element with 'ax-if' (Article V).";

describe("validateBindings — ax-else pairing", () => {
  test("accepts an ax-else directly after its ax-if sibling", () => {
    const v = V(`<p ax-if="count">Y</p><p ax-else>N</p>`);
    expect(() => validateBindings(v, FULL)).not.toThrow();
  });

  test("THROWS on an orphan ax-else with the exact message", () => {
    const v = V(`<p ax-else>N</p>`);
    expect(() => validateBindings(v, FULL)).toThrow(ORPHAN_ELSE_ERROR);
  });

  test("THROWS when the ax-if is a child rather than a sibling", () => {
    const v = V(`<div><p ax-if="count">Y</p></div><p ax-else>N</p>`);
    expect(() => validateBindings(v, FULL)).toThrow(ORPHAN_ELSE_ERROR);
  });

  test("THROWS when another element sits between the two branches", () => {
    const v = V(`<p ax-if="count">Y</p><hr /><p ax-else>N</p>`);
    expect(() => validateBindings(v, FULL)).toThrow(ORPHAN_ELSE_ERROR);
  });

  test("THROWS when ax-else carries a value", () => {
    const v = V(`<p ax-if="count">Y</p><p ax-else="count">N</p>`);
    expect(() => validateBindings(v, FULL)).toThrow(
      "🚨 ADVANXJS CONTRACT VIOLATION: 'ax-else' takes no value — " +
      "write it as a bare attribute (Article I).",
    );
  });
});

describe("validateBindings — attribute bindings", () => {
  test("accepts :attr and ax-bind:attr bound to a signal or computed", () => {
    const v = V(`<img :src="count" ax-bind:alt="double" :class="count" />`);
    expect(() => validateBindings(v, FULL)).not.toThrow();
  });

  test("THROWS when the bound symbol is not exported", () => {
    const v = V(`<img :src="mystery" />`);
    expect(() => validateBindings(v, FULL)).toThrow(/Missing exports for \[mystery\]/);
  });

  test("THROWS when the bound symbol is an action, not reactive state", () => {
    const v = V(`<img :src="increment" />`);
    expect(() => validateBindings(v, FULL)).toThrow(
      '🚨 ADVANXJS CONTRACT VIOLATION: :src="increment" requires "increment" to be a ' +
      "signal or computed exported from logic.ts.",
    );
  });

  test("THROWS on an expression in a bound attribute (Article I)", () => {
    const v = V(`<img :src="count + 1" />`);
    expect(() => validateBindings(v, FULL)).toThrow(/:src="count \+ 1" must be a bare identifier/);
  });

  test("a loop alias is not reactive state and cannot be bound", () => {
    const v = V(`<li ax-for="item in items" :title="item">x</li>`);
    expect(() => validateBindings(v, FULL)).toThrow(/requires "item" to be a/);
  });
});
