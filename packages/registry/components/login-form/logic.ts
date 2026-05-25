import { signal, computed } from "@preact/signals-core";

export const email = signal("");
export const password = signal("");
export const loading = signal(false);
export const success = signal(false);
export const buttonLabel = computed(() => (loading.value ? "Signing in…" : "Sign In"));

export function login() {
  if (loading.value) return;
  success.value = false;
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    success.value = true;
  }, 2000);
}
