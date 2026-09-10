import { signal } from "@preact/signals-core";

export const eyebrow = signal("Advanx Motion");
export const title = signal("Spotlight Card");
export const description = signal(
  "A radial highlight follows the pointer across the surface, then fades away when it leaves."
);

// Article I note — "No UI in the Logic."
// Pointer position cannot reach CSS through a binding: mustaches interpolate
// text nodes only, and attribute mustaches are a hard contract violation until
// M2 lands attribute bindings. The native event (passed as the last handler
// argument) is therefore the only channel, so these two actions write CSS
// custom properties directly onto the element the listener is bound to.
// `currentTarget` is valid here because the action runs during dispatch.
export function onMouseMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement | null;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--ax-mouse-x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--ax-mouse-y", `${e.clientY - rect.top}px`);
  el.style.setProperty("--ax-spotlight-opacity", "1");
}

export function onMouseLeave(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement | null;
  if (!el) return;
  el.style.setProperty("--ax-spotlight-opacity", "0");
}
