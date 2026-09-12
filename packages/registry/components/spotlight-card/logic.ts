import { signal, computed } from "../../lib/advanx/runtime.ts";

export const eyebrow = signal("Advanx Motion");
export const title = signal("Spotlight Card");
export const description = signal(
  "A radial highlight follows the pointer across the surface, then fades away when it leaves."
);

// Pointer state is data, not UI. The actions below write only signals; the view
// declares where that data lands via `:style`, so Article I holds both ways —
// no UI in the logic, no logic in the view.
export const mouseX = signal(0);
export const mouseY = signal(0);
export const lit = signal(false);

export const spotlightStyle = computed(() => ({
  "--ax-mouse-x": `${mouseX.value}px`,
  "--ax-mouse-y": `${mouseY.value}px`,
  "--ax-spotlight-opacity": lit.value ? "1" : "0",
}));

// `getBoundingClientRect` is a geometry read, not a style write: pointer
// coordinates are viewport-relative and have to be rebased against the element
// the listener sits on. `currentTarget` is valid because the action runs during
// dispatch.
export function onMouseMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement | null;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;
  lit.value = true;
}

export function onMouseLeave() {
  lit.value = false;
}
