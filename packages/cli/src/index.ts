#!/usr/bin/env bun
import { compileComponent } from "../../compiler/src/index.ts";
import path from "path";

const target = process.argv[2];
if (!target) {
  console.error("Usage: advanx <component-folder>");
  process.exit(1);
}

try {
  await compileComponent(path.resolve(target));
  console.log("✔ AdvanxJS: Contract Satisfied. Build successful.");
} catch (err: any) {
  console.error(err.message);
  process.exit(1);
}
