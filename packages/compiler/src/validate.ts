import type { LogicAnalysis } from "./analyze";
import type { ViewBindings } from "./parseView";

const IDENT = /^[A-Za-z_$][\w$]*$/;

export function validateBindings(view: ViewBindings, logic: LogicAnalysis) {
  // Article I — No logic in the View. Directive values must be bare identifiers.
  for (const name of view.conditionals) {
    if (!IDENT.test(name)) throw articleI("ax-if", name);
  }
  for (const { event, handler } of view.events) {
    if (!IDENT.test(handler)) throw articleI(`ax-on:${event}`, handler);
  }
  for (const { alias, source } of view.loops) {
    if (!IDENT.test(alias)) throw articleI("ax-for alias", alias);
    if (!IDENT.test(source)) throw articleI("ax-for source", source);
  }
  for (const name of view.models) {
    if (!IDENT.test(name)) throw articleI("ax-model", name);
  }

  const signals = new Set(logic.signals);
  const reactive = new Set([...logic.signals, ...logic.computed]);
  const actions = new Set(logic.actions);
  const loopAliases = new Set(view.loops.map(l => l.alias));
  const declared = new Set([...reactive, ...actions, ...loopAliases]);

  const missing = new Set<string>();
  view.mustaches.forEach(n => {
    const root = n.split(".")[0];
    if (!declared.has(root)) missing.add(n);
  });
  view.conditionals.forEach(n => { if (!declared.has(n)) missing.add(n); });
  view.events.forEach(({ handler }) => { if (!declared.has(handler)) missing.add(handler); });
  view.models.forEach(n => { if (!declared.has(n)) missing.add(n); });

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

  for (const { alias, source } of view.loops) {
    if (!reactive.has(source)) {
      throw new Error(
        `🚨 ADVANXJS CONTRACT VIOLATION: ax-for="${alias} in ${source}" requires "${source}" ` +
        `to be a signal or computed exported from logic.ts.`
      );
    }
  }

  for (const name of view.models) {
    if (!signals.has(name)) {
      throw new Error(
        `🚨 ADVANXJS CONTRACT VIOLATION: ax-model="${name}" requires "${name}" to be a writable signal ` +
        `(not a computed or action).`
      );
    }
  }
}

function articleI(attr: string, value: string): Error {
  return new Error(
    `🚨 ADVANXJS CONTRACT VIOLATION: ${attr}="${value}" must be a bare identifier — ` +
    `expressions belong in logic.ts (Article I).`
  );
}
