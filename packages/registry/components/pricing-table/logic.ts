import { signal, computed } from "@preact/signals-core";

export const isYearly = signal(false);

const MONTHLY = { basic: 9, pro: 29, enterprise: 99 };
const fmt = (m: number) => (isYearly.value ? `$${m * 10}` : `$${m}`);

export const basicPrice = computed(() => fmt(MONTHLY.basic));
export const proPrice = computed(() => fmt(MONTHLY.pro));
export const enterprisePrice = computed(() => fmt(MONTHLY.enterprise));
export const period = computed(() => (isYearly.value ? "/year" : "/month"));
export const billingLabel = computed(() =>
  isYearly.value ? "Billed yearly · Save 17%" : "Billed monthly"
);
export const toggleLabel = computed(() =>
  isYearly.value ? "Switch to monthly" : "Switch to yearly"
);

export function toggleBilling() {
  isYearly.value = !isYearly.value;
}
