#!/usr/bin/env bun
// Article VI — Performance as a Constraint. The core runtime (runtime + directives
// + signals) must stay under 5KB gzipped. This turns the constitutional promise
// into an enforced, CI-failing invariant.
import path from "path";

const BUDGET = 5 * 1024; // 5 KB gzipped
const entry = path.resolve(import.meta.dir, "..", "packages", "core", "src", "runtime.ts");

const result = await Bun.build({
  entrypoints: [entry],
  minify: true,
  target: "browser",
  format: "iife",
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const code = await result.outputs[0]!.text();
const gz = Bun.gzipSync(new TextEncoder().encode(code)).byteLength;

console.log(
  `core runtime: ${code.length} B raw → ${gz} B gzipped (budget ${BUDGET} B)`,
);

if (gz > BUDGET) {
  console.error(`❌ Article VI VIOLATION: core runtime is ${gz} B gzipped, over the ${BUDGET} B budget.`);
  process.exit(1);
}
console.log("✅ Article VI satisfied.");
