import type { LogicAnalysis } from "./analyze";
import type { ViewBindings } from "./parseView";

export function validateBindings(view: ViewBindings, logic: LogicAnalysis) {
  const actions = new Set(logic.actions);
  const declared = new Set([...logic.signals, ...logic.computed, ...logic.actions]);

  const missing = new Set<string>();
  view.mustaches.forEach(n => { if (!declared.has(n)) missing.add(n); });
  view.conditionals.forEach(n => { if (!declared.has(n)) missing.add(n); });
  view.events.forEach(({ handler }) => { if (!declared.has(handler)) missing.add(handler); });

  if (missing.size) {
    throw new Error(
      `🚨 ADVANXJS CONTRACT VIOLATION: Missing exports for [${[...missing].join(", ")}]`
    );
  }

  for (const { event, handler } of view.events) {
    if (!actions.has(handler)) {
      throw new Error(
        `🚨 ADVANXJS CONTRACT VIOLATION: ax-on:${event}="${handler}" expects an action (function), ` +
        `but "${handler}" is a signal/computed.`
      );
    }
  }
}
