// Registry components import `../../lib/advanx/runtime.ts` — the path that
// resolves to src/lib/advanx/runtime.ts once `advanx add` copies a component
// into a user's project (Article II, "One Brain": one signals instance, shared
// with the runtime that wires the DOM).
//
// In the monorepo the same components sit at packages/registry/components/<name>/,
// where that path lands here instead. This re-export makes the specifier resolve
// in both places, so the component file is byte-identical in source and when
// shipped — and monorepo tests exercise the same instance the browser will.
export * from "../../../core/src/runtime.ts";
