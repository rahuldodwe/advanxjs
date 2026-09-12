import type { LogicAnalysis } from "./analyze";
import type { ViewBindings } from "./parseView";
import { IDENT, LITERAL, parseHandler, type ParsedHandler } from "./handlers";

export function validateBindings(view: ViewBindings, logic: LogicAnalysis) {
  // The compiler must never green-light syntax the runtime cannot execute.
  // Attribute mustaches still parse cleanly but are inert: wireMustaches and
  // hydrateClone walk text nodes only. Checked first so the specific
  // "not yet supported" message wins over a generic contract error.
  const attrMustache = view.attributeMustaches[0];
  if (attrMustache) {
    throw new Error(
      `🚨 ADVANXJS CONTRACT VIOLATION: Attribute mustache interpolation is not yet supported. ` +
      `Use a binding instead: :${attrMustache.attribute}="${attrMustache.expression}" (Article V).` +
      `\n  Found: ${attrMustache.attribute}="{{ ${attrMustache.expression} }}"`
    );
  }

  // `ax-else` is a structural marker, not a binding: it carries no value and is
  // only meaningful directly after an `ax-if` sibling, which is the exact pairing
  // wireConditionals looks for at runtime.
  for (const e of view.elses) {
    if (e.valued) {
      throw new Error(
        `🚨 ADVANXJS CONTRACT VIOLATION: 'ax-else' takes no value — write it as a bare attribute (Article I).`
      );
    }
    if (!e.followsIf) {
      throw new Error(
        `🚨 ADVANXJS CONTRACT VIOLATION: 'ax-else' must be an immediate sibling following an element with 'ax-if' (Article V).`
      );
    }
  }

  // Article I — No logic in the View. Directive values must be bare identifiers
  // (handlers additionally accept `name(arg1, arg2, ...)` where each arg is a
  // dot-path or literal — no operators, no nested calls).
  for (const name of view.conditionals) {
    if (!IDENT.test(name)) throw articleI("ax-if", name);
  }
  const parsedEvents: { event: string; handler: string; parsed: ParsedHandler }[] = [];
  for (const { event, handler } of view.events) {
    const parsed = parseHandler(handler);
    if (!parsed) throw articleI(`ax-on:${event}`, handler);
    parsedEvents.push({ event, handler, parsed });
  }
  for (const { alias, source } of view.loops) {
    if (!IDENT.test(alias)) throw articleI("ax-for alias", alias);
    if (!IDENT.test(source)) throw articleI("ax-for source", source);
  }
  for (const name of view.models) {
    if (!IDENT.test(name)) throw articleI("ax-model", name);
  }
  for (const { attribute, source } of view.boundAttributes) {
    if (!IDENT.test(source)) throw articleI(`:${attribute}`, source);
  }

  const signals = new Set(logic.signals);
  const reactive = new Set([...logic.signals, ...logic.computed]);
  const actions = new Set(logic.actions);
  const loopAliases = new Set(view.loops.map(l => l.alias));
  const declared = new Set([...reactive, ...actions, ...loopAliases]);

  const missing = new Set<string>();
  view.mustaches.forEach(n => {
    const root = n.split(".")[0]!;
    if (!declared.has(root)) missing.add(n);
  });
  view.conditionals.forEach(n => { if (!declared.has(n)) missing.add(n); });
  parsedEvents.forEach(({ parsed }) => {
    if (!declared.has(parsed.name)) missing.add(parsed.name);
    for (const a of parsed.args) {
      if (LITERAL.test(a)) continue;
      const root = a.split(".")[0]!;
      if (!declared.has(root)) missing.add(root);
    }
  });
  view.models.forEach(n => { if (!declared.has(n)) missing.add(n); });
  view.boundAttributes.forEach(b => { if (!declared.has(b.source)) missing.add(b.source); });

  if (missing.size) {
    throw new Error(
      `🚨 ADVANXJS CONTRACT VIOLATION: Missing exports for [${[...missing].join(", ")}]`
    );
  }

  for (const { event, handler, parsed } of parsedEvents) {
    if (!actions.has(parsed.name)) {
      throw new Error(
        `🚨 ADVANXJS CONTRACT VIOLATION: ax-on:${event}="${handler}" expects an action (function), ` +
        `but "${parsed.name}" is a signal/computed.`
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

  for (const { attribute, source } of view.boundAttributes) {
    if (!reactive.has(source)) {
      throw new Error(
        `🚨 ADVANXJS CONTRACT VIOLATION: :${attribute}="${source}" requires "${source}" to be a ` +
        `signal or computed exported from logic.ts.`
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
    `🚨 ADVANXJS CONTRACT VIOLATION: ${attr}="${value}" must be a bare identifier ` +
    `(handlers may also use "name(arg, ...)" with dot-paths or literals) — ` +
    `expressions belong in logic.ts (Article I).`
  );
}
