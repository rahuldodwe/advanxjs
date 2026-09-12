import { signal } from "../../lib/advanx/runtime.ts";

// The drift is entirely CSS @keyframes — no signal drives the motion, so this
// component ships only the two content bindings.
export const title = signal("Built for the modern web");
export const subtitle = signal(
  "Three blurred gradient orbs drift behind your content, composited on the GPU."
);
