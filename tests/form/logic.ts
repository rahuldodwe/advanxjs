import { signal, computed } from "../../packages/core/src/runtime.ts";

export const name = signal("");
export const email = signal("");
export const user = computed(() => ({ name: name.value, email: email.value }));

export function reset() {
  name.value = "";
  email.value = "";
}
