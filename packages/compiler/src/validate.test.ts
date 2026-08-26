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

// The Honesty Compiler: syntax the runtime cannot execute must fail the build
// rather than compile to a silent no-op. Asserted against the exact strings —
// a match on /CONTRACT VIOLATION/ alone would not catch a wrong message.
const ELSE_ERROR =
  "🚨 ADVANXJS CONTRACT VIOLATION: 'ax-else' is not yet supported in the runtime. " +
  "Use inverted 'ax-if' booleans in logic.ts (Article I/V).";

const ATTR_ERROR =
  "🚨 ADVANXJS CONTRACT VIOLATION: Attribute mustache interpolation is not yet supported. " +
  "Use direct element bindings or directives (Article V).";

describe("validateBindings — unimplemented syntax must not compile", () => {
  test("THROWS on ax-else with the exact message", () => {
    const v = V(`<p ax-if="count">Y</p><p ax-else>N</p>`);
    expect(() => validateBindings(v, FULL)).toThrow(ELSE_ERROR);
  });

  test("THROWS on ax-else even when every symbol is exported", () => {
    const v = V(`<p ax-else>N</p>`);
    expect(() => validateBindings(v, FULL)).toThrow(ELSE_ERROR);
  });

  test("THROWS on a mustache in a plain attribute with the exact message", () => {
    const v = V(`<img src="{{ count }}" alt="x" />`);
    expect(() => validateBindings(v, FULL)).toThrow(ATTR_ERROR);
  });

  test("THROWS on a mustache in class, not just src", () => {
    const v = V(`<div class="{{ count }}">x</div>`);
    expect(() => validateBindings(v, FULL)).toThrow(ATTR_ERROR);
  });

  test("THROWS on a mustache in a directive attribute (the shipped navbar bug)", () => {
    const v = V(`<a ax-link="{{ count }}">go</a>`);
    expect(() => validateBindings(v, FULL)).toThrow(ATTR_ERROR);
  });

  test("names the offending attribute so the failure is debuggable", () => {
    const v = V(`<a ax-link="{{ count }}">go</a>`);
    expect(() => validateBindings(v, FULL)).toThrow(/Found: ax-link="\{\{ count \}\}"/);
  });

  test("an exported symbol does not excuse an attribute mustache", () => {
    // `count` IS exported — position is what makes this dead, not the contract.
    const v = V(`<img src="{{ count }}" />`);
    expect(() => validateBindings(v, FULL)).toThrow(ATTR_ERROR);
  });

  test("text mustaches and static attributes still pass", () => {
    const v = V(`<a ax-link="/about" class="cta">{{ count }}</a>`);
    expect(() => validateBindings(v, FULL)).not.toThrow();
  });
});
