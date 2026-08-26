import type { LogicAnalysis } from "./analyze";
import type { ViewBindings } from "./parseView";

const IDENT = /^[A-Za-z_$][\w$]*$/;
const PATH = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/;
const LITERAL = /^("[^"]*"|'[^']*'|-?\d+(\.\d+)?|true|false|null)$/;
const CALL = /^([A-Za-z_$][\w$]*)(?:\((.*)\))?$/;

type ParsedHandler = { name: string; args: string[] };

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let buf = "", q = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    if (q) { if (ch === q) q = 0; buf += s[i]; }
    else if (ch === 34 || ch === 39) { q = ch; buf += s[i]; }
    else if (ch === 44) { out.push(buf); buf = ""; }
    else buf += s[i];
  }
  if (buf.trim()) out.push(buf);
  return out;
}

function parseHandler(handler: string): ParsedHandler | null {
  const m = handler.match(CALL);
  if (!m) return null;
  if (m[2] === undefined) return { name: m[1]!, args: [] };
  const args = splitArgs(m[2]).map(a => a.trim());
  for (const a of args) {
    if (!LITERAL.test(a) && !PATH.test(a)) return null;
  }
  return { name: m[1]!, args };
}

export function validateBindings(view: ViewBindings, logic: LogicAnalysis) {
  // The compiler must never green-light syntax the runtime cannot execute. These
  // two parse cleanly but are inert at runtime — `ax-else` has no handler in
  // directives.ts, and no attribute is ever interpolated (wireMustaches and
  // hydrateClone walk text nodes only). Checked first so the specific
  // "not yet supported" message wins over a generic contract error.
  if (view.elses > 0) {
    throw new Error(
      `🚨 ADVANXJS CONTRACT VIOLATION: 'ax-else' is not yet supported in the runtime. ` +
      `Use inverted 'ax-if' booleans in logic.ts (Article I/V).`
    );
  }

  const attrMustache = view.attributeMustaches[0];
  if (attrMustache) {
    throw new Error(
      `🚨 ADVANXJS CONTRACT VIOLATION: Attribute mustache interpolation is not yet supported. ` +
      `Use direct element bindings or directives (Article V).` +
      `\n  Found: ${attrMustache.attribute}="{{ ${attrMustache.expression} }}"`
    );
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
