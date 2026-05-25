import { signal, computed } from "@preact/signals-core";

export const name = signal("");
export const email = signal("");
export const message = signal("");
export const isSent = signal(false);
export const notSent = computed(() => !isSent.value);

export function submit() {
  isSent.value = true;
}
