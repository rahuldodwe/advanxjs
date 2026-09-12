import { describe, expect, test } from "bun:test";
import { mount, signal } from "./runtime.ts";

function render(html: string, logic: any): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  mount(root, logic);
  return root;
}

describe("ax-else pairing", () => {
  test("mounts the if branch and places a comment for the else branch", () => {
    const on = signal(true);
    const root = render(`<p ax-if="on">YES</p><p ax-else>NO</p>`, { on });
    expect(root.textContent).toBe("YES");
    expect(root.innerHTML).toContain("<!-- ax-else -->");
    expect(root.innerHTML).not.toContain("<!-- ax-if -->");
  });

  test("swaps to the else branch when the condition goes falsy", () => {
    const on = signal(true);
    const root = render(`<p ax-if="on">YES</p><p ax-else>NO</p>`, { on });
    on.value = false;
    expect(root.textContent).toBe("NO");
    expect(root.innerHTML).toContain("<!-- ax-if -->");
    expect(root.innerHTML).not.toContain("<!-- ax-else -->");
  });

  test("toggles back and forth without losing either branch", () => {
    const on = signal(false);
    const root = render(`<p ax-if="on">YES</p><p ax-else>NO</p>`, { on });
    expect(root.textContent).toBe("NO");
    on.value = true;
    expect(root.textContent).toBe("YES");
    on.value = false;
    expect(root.textContent).toBe("NO");
  });

  test("strips the ax-else marker from the rendered element", () => {
    const on = signal(false);
    const root = render(`<p ax-if="on">YES</p><p ax-else>NO</p>`, { on });
    expect(root.querySelector("p")!.hasAttribute("ax-else")).toBe(false);
  });

  // wireConditionals runs last in mount() precisely so a branch that starts
  // hidden is still wired before it is detached.
  test("wires bindings inside a branch that starts hidden", () => {
    const on = signal(true);
    const label = signal("before");
    let taps = 0;
    const root = render(
      `<p ax-if="on">YES</p><button ax-else ax-on:click="tap">{{ label }}</button>`,
      { on, label, tap: () => taps++ },
    );
    on.value = false;
    const btn = root.querySelector("button")!;
    expect(btn.textContent).toBe("before");
    btn.click();
    expect(taps).toBe(1);
    label.value = "after";
    expect(btn.textContent).toBe("after");
  });

  test("an ax-if with no else still behaves as before", () => {
    const on = signal(true);
    const root = render(`<p ax-if="on">YES</p>`, { on });
    expect(root.textContent).toBe("YES");
    on.value = false;
    expect(root.textContent).toBe("");
    expect(root.innerHTML).toContain("<!-- ax-if -->");
  });
});
