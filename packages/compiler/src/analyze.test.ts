import { describe, expect, test } from "bun:test";
import { analyzeLogic } from "./analyze.ts";

describe("analyzeLogic", () => {
  test("classifies exported signals, computed, and actions", () => {
    const a = analyzeLogic(`
import { signal, computed } from "./runtime";
export const count = signal(0);
export const name = signal("x");
export const double = computed(() => count.value * 2);
export function increment() { count.value++; }
export const decrement = () => { count.value--; };
`);
    expect(a.signals.sort()).toEqual(["count", "name"]);
    expect(a.computed).toEqual(["double"]);
    expect(a.actions.sort()).toEqual(["decrement", "increment"]);
  });

  test("ignores non-exported declarations (Article V — only the contract is public)", () => {
    const a = analyzeLogic(`
import { signal } from "./runtime";
const hidden = signal(1);
export const shown = signal(2);
`);
    expect(a.signals).toEqual(["shown"]);
  });

  // Known analyzer blind spots — documented targets for a future upgrade (M2).
  test.todo("detects signals created through a renamed or wrapped import");
  test.todo("detects symbols surfaced via `export { x }` statements");
});
