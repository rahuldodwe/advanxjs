import { signal } from "@preact/signals-core";

// Navigation state
export const isMenuOpen = signal(false);

// Routes are written directly into view.html: the runtime interpolates text
// nodes only, so an `ax-link="{{ … }}"` never resolves and every link would
// fall back to "/". Attribute bindings are M2.

// Actions
export function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

export function closeMenu() {
  isMenuOpen.value = false;
}
