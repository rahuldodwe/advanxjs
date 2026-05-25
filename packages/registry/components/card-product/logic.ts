import { signal, computed } from "@preact/signals-core";

export const title = signal("Aurora Wireless Headphones");
export const price = signal("$199");
export const isAdded = signal(false);
export const notAdded = computed(() => !isAdded.value);

export function addToCart() {
  isAdded.value = !isAdded.value;
}
