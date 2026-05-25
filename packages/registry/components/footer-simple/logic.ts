import { signal, computed } from "@preact/signals-core";

export const year = signal(new Date().getFullYear());
export const copyright = computed(() => `© ${year.value} AdvanxJS. All rights reserved.`);
