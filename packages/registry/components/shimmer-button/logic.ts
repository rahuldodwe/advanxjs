import { signal, computed } from "../../lib/advanx/runtime.ts";

export const pressCount = signal(0);

export const label = computed(() =>
  pressCount.value === 0 ? "Get Started" : "Let's go →"
);

// The border shine is pure CSS (@keyframes on a conic gradient), so nothing
// here drives the animation — this only tracks the click state.
export function press() {
  pressCount.value++;
}
