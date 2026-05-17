import { signal } from "@preact/signals-core";

export const siteName = signal("AdvanxJS SPA");
export const clicks = signal(0);

export function bump() {
  clicks.value++;
}
