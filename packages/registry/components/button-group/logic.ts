import { signal } from "@preact/signals-core";

// Button labels
export const primaryLabel = signal("Confirm");
export const secondaryLabel = signal("Cancel");

// Actions - override these in your component
export function onPrimaryClick() {
  console.log("Primary button clicked");
}

export function onSecondaryClick() {
  console.log("Secondary button clicked");
}
