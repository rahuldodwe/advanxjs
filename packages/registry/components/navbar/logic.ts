import { signal } from "@preact/signals-core";

// Navigation state
export const isMenuOpen = signal(false);

// Navigation links configuration
export const navLinks = signal([
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
]);

// Actions
export function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

export function closeMenu() {
  isMenuOpen.value = false;
}
