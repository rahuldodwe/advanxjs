import { signal, computed } from "../../packages/core/src/runtime.ts";
export const showSecret = signal(false);
export const btnText = computed(() => showSecret.value ? "Hide" : "Show");
export function toggle() { showSecret.value = !showSecret.value; }
