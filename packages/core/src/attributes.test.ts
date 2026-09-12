import { describe, expect, test } from "bun:test";
import { computed, mount, signal } from "./runtime.ts";

function render(html: string, logic: any): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  mount(root, logic);
  return root;
}

describe("ax-bind / : attribute bindings", () => {
  test("sets a general attribute and updates it reactively", () => {
    const src = signal("/a.png");
    const root = render(`<img :src="src" />`, { src });
    const img = root.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/a.png");
    src.value = "/b.png";
    expect(img.getAttribute("src")).toBe("/b.png");
  });

  test("the ax-bind: long form behaves identically", () => {
    const href = signal("/docs");
    const root = render(`<a ax-bind:href="href">go</a>`, { href });
    expect(root.querySelector("a")!.getAttribute("href")).toBe("/docs");
  });

  test("removes the prefixed attribute from the rendered DOM", () => {
    const src = signal("/a.png");
    const root = render(`<img :src="src" ax-bind:alt="src" />`, { src });
    const img = root.querySelector("img")!;
    expect(img.hasAttribute(":src")).toBe(false);
    expect(img.hasAttribute("ax-bind:alt")).toBe(false);
  });

  test("boolean attributes are added when truthy and removed when falsy", () => {
    const loading = signal(true);
    const root = render(`<button :disabled="loading">x</button>`, { loading });
    const btn = root.querySelector("button")!;
    expect(btn.hasAttribute("disabled")).toBe(true);
    loading.value = false;
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  test("a falsy boolean never renders as disabled=\"false\"", () => {
    const loading = signal(false);
    const root = render(`<button :disabled="loading">x</button>`, { loading });
    expect(root.innerHTML).not.toContain("false");
  });

  // Asserted through serialization, not getAttribute/className: happy-dom
  // collides the `:class` attribute with `class` in its lookup map, so its read
  // APIs return the stale static value even though the written attribute — and
  // therefore the SSG output and every real browser — is correct.
  test(":class merges with the static class rather than erasing it", () => {
    const theme = signal("dark");
    const root = render(`<div class="card" :class="theme">x</div>`, { theme });
    expect(root.innerHTML).toContain(`class="card dark"`);
    theme.value = "light";
    expect(root.innerHTML).toContain(`class="card light"`);
  });

  test(":class with no static class sets the class outright", () => {
    const theme = signal("dark");
    const root = render(`<div :class="theme">x</div>`, { theme });
    expect(root.querySelector("div")!.getAttribute("class")).toBe("dark");
  });

  test(":style applies an object, including CSS custom properties", () => {
    const style = signal({ "--ax-x": "4px", color: "red" });
    const root = render(`<div :style="style">x</div>`, { style });
    const el = root.querySelector("div") as HTMLElement;
    expect(el.style.getPropertyValue("--ax-x")).toBe("4px");
    expect(el.style.color).toBe("red");
    style.value = { "--ax-x": "9px", color: "blue" };
    expect(el.style.getPropertyValue("--ax-x")).toBe("9px");
    expect(el.style.color).toBe("blue");
  });

  test(":style accepts a plain string as cssText", () => {
    const style = signal("color: green");
    const root = render(`<div :style="style">x</div>`, { style });
    expect((root.querySelector("div") as HTMLElement).style.color).toBe("green");
  });

  test("binds a computed, not just a signal", () => {
    const n = signal(2);
    const label = computed(() => `n-${n.value}`);
    const root = render(`<div :id="label">x</div>`, { n, label });
    const el = root.querySelector("div")!;
    expect(el.getAttribute("id")).toBe("n-2");
    n.value = 3;
    expect(el.getAttribute("id")).toBe("n-3");
  });

  test("a null value removes the attribute", () => {
    const alt = signal<string | null>("hi");
    const root = render(`<img :alt="alt" />`, { alt });
    const img = root.querySelector("img")!;
    expect(img.getAttribute("alt")).toBe("hi");
    alt.value = null;
    expect(img.hasAttribute("alt")).toBe(false);
  });

  test("an unknown symbol strips the prefix without throwing", () => {
    const root = render(`<img :src="nope" />`, {});
    const img = root.querySelector("img")!;
    expect(img.hasAttribute(":src")).toBe(false);
    expect(img.hasAttribute("src")).toBe(false);
  });

  test("ax-on: is left to wireEvents, never treated as a binding", () => {
    let taps = 0;
    const root = render(`<button ax-on:click="tap">x</button>`, { tap: () => taps++ });
    root.querySelector("button")!.click();
    expect(taps).toBe(1);
  });

  test("binds on the root element itself, not only descendants", () => {
    const hidden = signal(true);
    const root = document.createElement("div");
    root.setAttribute(":hidden", "hidden");
    mount(root, { hidden });
    expect(root.hasAttribute("hidden")).toBe(true);
    hidden.value = false;
    expect(root.hasAttribute("hidden")).toBe(false);
  });
});
