import { describe, expect, test } from "bun:test";
import { mount, signal } from "./runtime.ts";

function render(html: string, logic: any): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  mount(root, logic);
  return root;
}

describe("mustache binding", () => {
  test("renders and reactively updates on signal change", () => {
    const count = signal(0);
    const root = render(`<p>Count: {{ count }}</p>`, { count });
    expect(root.querySelector("p")!.textContent).toBe("Count: 0");
    count.value = 5;
    expect(root.querySelector("p")!.textContent).toBe("Count: 5");
  });
});

describe("ax-on events", () => {
  test("invokes the bound action on click", () => {
    const count = signal(0);
    const root = render(`<button ax-on:click="inc">+</button>`, {
      count,
      inc: () => count.value++,
    });
    root.querySelector("button")!.click();
    expect(count.value).toBe(1);
  });

  test("passes parsed literal args to the handler", () => {
    const total = signal(0);
    const root = render(`<button ax-on:click="add(5)">+5</button>`, {
      add: (n: number) => (total.value += n),
    });
    root.querySelector("button")!.click();
    expect(total.value).toBe(5);
  });
});

describe("ax-if conditional", () => {
  test("mounts/unmounts the element as the signal toggles", () => {
    const show = signal(true);
    const root = render(`<div><span ax-if="show">secret</span></div>`, { show });
    expect(root.querySelector("span")).not.toBeNull();
    show.value = false;
    expect(root.querySelector("span")).toBeNull();
    show.value = true;
    expect(root.querySelector("span")).not.toBeNull();
  });
});

describe("ax-for list rendering", () => {
  test("renders, appends, and removes rows reactively", () => {
    const items = signal(["a", "b"]);
    const root = render(`<ul><li ax-for="item in items">{{ item }}</li></ul>`, { items });
    expect(root.querySelectorAll("li").length).toBe(2);
    items.value = [...items.value, "c"];
    expect(root.querySelectorAll("li").length).toBe(3);
    items.value = items.value.slice(0, 1);
    expect(root.querySelectorAll("li").length).toBe(1);
  });

  // Known runtime debt (M2): loop-item mustaches are substituted once and do not
  // re-render when a per-item signal changes; ax-for is index-based, not keyed.
  test.todo("re-renders loop-item mustaches when a per-item signal changes");
  test.todo("uses keyed reconciliation instead of index-based diffing");
});

describe("ax-model two-way binding", () => {
  test("syncs input → signal and signal → input", () => {
    const name = signal("");
    const root = render(`<input ax-model="name" />`, { name });
    const input = root.querySelector("input")!;

    input.value = "ada";
    input.dispatchEvent(new Event("input"));
    expect(name.value).toBe("ada");

    name.value = "grace";
    expect(input.value).toBe("grace");
  });
});
