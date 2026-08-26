import { describe, expect, test } from "bun:test";
import { parseView } from "./parseView.ts";

describe("parseView", () => {
  test("extracts all five directive families", () => {
    const b = parseView(`
<p>{{ a }} and {{ b.c }}</p>
<span ax-if="show">hi</span>
<button ax-on:click="go">x</button>
<ul><li ax-for="item in items">{{ item.label }}</li></ul>
<input ax-model="name" />
`);
    expect(b.mustaches).toContain("a");
    expect(b.mustaches).toContain("b.c");
    expect(b.mustaches).toContain("item.label");
    expect(b.conditionals).toEqual(["show"]);
    expect(b.events).toEqual([{ event: "click", handler: "go" }]);
    expect(b.loops).toEqual([{ alias: "item", source: "items" }]);
    expect(b.models).toEqual(["name"]);
  });

  test("captures handler call args and multiple events", () => {
    const b = parseView(
      `<button ax-on:click="remove(todo.id)">x</button><form ax-on:submit="save"></form>`,
    );
    expect(b.events).toEqual([
      { event: "click", handler: "remove(todo.id)" },
      { event: "submit", handler: "save" },
    ]);
  });

  test("a static view yields no bindings (Article III)", () => {
    const b = parseView("<div><h1>Hello</h1><p>static</p></div>");
    expect(b.mustaches).toEqual([]);
    expect(b.conditionals).toEqual([]);
    expect(b.events).toEqual([]);
    expect(b.loops).toEqual([]);
    expect(b.models).toEqual([]);
  });
});
