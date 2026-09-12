import { signal, computed } from "../../lib/advanx/runtime.ts";

export const isCollapsed = signal(false);
export const isExpanded = computed(() => !isCollapsed.value);
export const toggleIcon = computed(() => (isCollapsed.value ? "»" : "«"));

export function toggle() {
  isCollapsed.value = !isCollapsed.value;
}
