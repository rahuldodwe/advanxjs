import { signal, computed } from "../../lib/advanx/runtime.ts";

export const year = signal(new Date().getFullYear());
export const copyright = computed(() => `© ${year.value} AdvanxJS. All rights reserved.`);
