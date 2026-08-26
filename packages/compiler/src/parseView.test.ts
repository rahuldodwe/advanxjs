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
    expect(b.attributeMustaches).toEqual([]);
    expect(b.conditionals).toEqual([]);
    expect(b.events).toEqual([]);
    expect(b.loops).toEqual([]);
    expect(b.models).toEqual([]);
    expect(b.elses).toBe(0);
  });
});

// The runtime interpolates text nodes only, so position decides whether a
// mustache is a live binding or dead markup. parseView has to tell them apart
// before validate can reject the dead ones.
describe("parseView — text vs attribute position", () => {
  test("splits text mustaches from attribute mustaches", () => {
    const b = parseView(`<p>{{ a }}</p><img src="{{ b }}" alt="x" />`);
    expect(b.mustaches).toEqual(["a"]);
    expect(b.attributeMustaches).toEqual([{ attribute: "src", expression: "b" }]);
  });

  test("names the attribute for plain and directive attributes alike", () => {
    const b = parseView(`<div class="{{ theme }}"><a ax-link="{{ link.path }}">go</a></div>`);
    expect(b.attributeMustaches).toEqual([
      { attribute: "class", expression: "theme" },
      { attribute: "ax-link", expression: "link.path" },
    ]);
    expect(b.mustaches).toEqual([]);
  });

  test("a loop-item mustache in a text node stays a real binding", () => {
    const b = parseView(`<li ax-for="x in xs">{{ x.label }}</li>`);
    expect(b.mustaches).toEqual(["x.label"]);
    expect(b.attributeMustaches).toEqual([]);
  });

  test("counts ax-else in attribute position", () => {
    expect(parseView(`<p ax-if="on">Y</p><p ax-else>N</p>`).elses).toBe(1);
    expect(parseView(`<p ax-else>a</p><span ax-else>b</span>`).elses).toBe(2);
  });

  test("does not count the words 'ax-else' appearing in body text", () => {
    expect(parseView(`<p>ax-else is not supported yet</p>`).elses).toBe(0);
  });
});
