import { effect, signal, computed } from "@preact/signals-core";
import {
  processLoops,
  wireMustaches,
  wireConditionals,
  wireEvents,
  wireModels,
} from "./directives";

export { signal, computed, effect };

export function mount(root: HTMLElement, logic: any) {
  processLoops(root, logic);
  wireMustaches(root, logic);
  wireConditionals(root, logic);
  wireEvents(root, logic);
  wireModels(root, logic);
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
