import { effect } from "@preact/signals-core";

// Attributes whose presence — not value — carries the meaning. A falsy signal
// removes them outright rather than rendering `disabled="false"`, which the DOM
// would still treat as disabled.
const BOOLEAN = new Set([
  "disabled", "checked", "hidden", "readonly", "required", "selected",
  "open", "multiple", "autofocus", "novalidate", "inert", "default",
]);

function applyStyle(el: HTMLElement, v: any) {
  if (v == null) { el.style.cssText = ""; return; }
  if (typeof v === "object") {
    // Custom properties (--ax-mouse-x) only exist through setProperty; plain
    // camelCase keys go through the style object as usual.
    for (const k in v) {
      const raw = v[k];
      const val = raw == null ? "" : String(raw);
      if (k.startsWith("--")) el.style.setProperty(k, val);
      else (el.style as any)[k] = val;
    }
    return;
  }
  el.style.cssText = String(v);
}

function bind(el: HTMLElement, attr: string, sig: any, base: string) {
  effect(() => {
    const v = sig.value;
    if (attr === "style") return applyStyle(el, v);
    if (attr === "class") {
      // The static class survives: `class="card" :class="theme"` yields both,
      // so a binding adds to the stylesheet contract rather than erasing it.
      const extra = v == null || v === false ? "" : String(v);
      el.setAttribute("class", base && extra ? `${base} ${extra}` : base || extra);
      return;
    }
    if (BOOLEAN.has(attr)) {
      if (v) el.setAttribute(attr, "");
      else el.removeAttribute(attr);
      return;
    }
    if (v == null || v === false) { el.removeAttribute(attr); return; }
    el.setAttribute(attr, String(v));
  });
}

/**
 * Wire `ax-bind:<attr>` / `:<attr>` to a signal or computed. The prefixed
 * attribute is removed, so the rendered DOM (and the SSG output, which runs this
 * same code against happy-dom) carries only the resolved attribute.
 */
export function wireAttributes(root: Element, logic: any) {
  const targets: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const el of targets) {
    // Snapshot: the loop removes attributes as it goes.
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name;
      const target = name.startsWith("ax-bind:")
        ? name.slice(8)
        : name.startsWith(":")
          ? name.slice(1)
          : null;
      if (!target) continue;
      el.removeAttribute(name);
      const sig = logic[attr.value.trim()];
      if (!sig || !("value" in sig)) continue;
      bind(el as HTMLElement, target, sig, el.getAttribute(target) ?? "");
    }
  }
}
