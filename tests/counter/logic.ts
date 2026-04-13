// We import from our own framework to ensure we share the same "Brain"
import { signal } from "../../packages/core/src/runtime.ts";

export const count = signal(0);

export function increment() {
  count.value++;
  console.log("AdvanxJS Logic: count.value is now", count.value);
}
