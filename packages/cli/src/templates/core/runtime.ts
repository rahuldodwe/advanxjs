import { effect, signal, computed } from "@preact/signals-core";
import {
  processLoops,
  wireMustaches,
  wireConditionals,
  wireEvents,
  wireModels,
} from "./directives";
import { wireAttributes } from "./attributes";

export { signal, computed, effect };
export { initRouter } from "./router";

export function mount(root: HTMLElement, logic: any) {
  processLoops(root, logic);
  wireMustaches(root, logic);
  wireEvents(root, logic);
  wireModels(root, logic);
  wireAttributes(root, logic);
  // Last on purpose: a branch that starts hidden is detached immediately, so
  // every other pass has to have wired it — including the `ax-else` side —
  // while it is still in the tree. Those bindings hold node references and
  // survive the swap, so a branch works the moment it mounts.
  wireConditionals(root, logic);
}

export function bootstrap(view: string, style: string, logic: any) {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
  const appDiv = document.getElementById("app");
  if (appDiv) {
    appDiv.innerHTML = view;
    mount(appDiv, logic);
  }
}
