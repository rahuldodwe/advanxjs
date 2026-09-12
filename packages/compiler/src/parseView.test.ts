import { describe, expect, test } from "bun:test";
import { hasBindings, parseView } from "./parseView.ts";

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
    expect(b.boundAttributes).toEqual([]);
    expect(b.elses).toEqual([]);
    expect(hasBindings(b)).toBe(false);
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

  test("pairs ax-else with an immediately preceding ax-if sibling", () => {
    expect(parseView(`<p ax-if="on">Y</p><p ax-else>N</p>`).elses)
      .toEqual([{ followsIf: true, valued: false }]);
    // Nesting is a real boundary: the ax-if below is a child, not a sibling.
    expect(parseView(`<div><p ax-if="on">Y</p></div><p ax-else>N</p>`).elses)
      .toEqual([{ followsIf: false, valued: false }]);
    // A void element still counts as the previous sibling.
    expect(parseView(`<img ax-if="on" /><p ax-else>N</p>`).elses)
      .toEqual([{ followsIf: true, valued: false }]);
  });

  test("flags an ax-else that carries a value", () => {
    expect(parseView(`<p ax-if="on">Y</p><p ax-else="x">N</p>`).elses)
      .toEqual([{ followsIf: true, valued: true }]);
  });

  test("does not count the words 'ax-else' appearing in body text", () => {
    expect(parseView(`<p>ax-else is a directive</p>`).elses).toEqual([]);
  });

  test("captures ax-bind: and : attribute bindings, but not ax-on:", () => {
    const b = parseView(
      `<button :disabled="loading" ax-bind:src="img" ax-on:click="go">x</button>`,
    );
    expect(b.boundAttributes).toEqual([
      { attribute: "disabled", source: "loading" },
      { attribute: "src", source: "img" },
    ]);
    expect(b.events).toEqual([{ event: "click", handler: "go" }]);
  });

  test("ignores a :attr= that appears in body text", () => {
    expect(parseView(`<p>use :disabled="loading" here</p>`).boundAttributes).toEqual([]);
  });

  test("a bound attribute alone makes a view non-static", () => {
    expect(hasBindings(parseView(`<img :src="hero" />`))).toBe(true);
  });
});
