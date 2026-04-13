import { signal, computed } from "../../packages/core/node_modules/@preact/signals-core";

export const isVisible = signal(false);

export const buttonText = computed(() => 
  isVisible.value ? "Hide Message" : "Show Message"
);

export function toggle() {
  isVisible.value = !isVisible.value;
}
