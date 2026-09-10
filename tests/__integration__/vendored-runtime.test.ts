import { describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";

// `advanx create` scaffolds a project against a vendored copy of the core
// runtime under packages/cli/src/templates/core/. Nothing kept it in sync with
// packages/core/src/, so shipping the native-event change to `wireEvents`
// (v0.1.23) left the template on the old `() => fn()` engine: the monorepo
// tests passed while every newly scaffolded project would have handed handlers
// `undefined` instead of the DOM event. Same drift class the ROADMAP flags for
// advanx-docs — this makes it a build failure instead of a silent regression.

const REPO = path.resolve(import.meta.dir, "../..");
const CORE = path.join(REPO, "packages", "core", "src");
const VENDORED = path.join(REPO, "packages", "cli", "src", "templates", "core");

const MIRRORED = ["runtime.ts", "directives.ts", "router.ts"];

describe("the CLI's vendored runtime mirrors packages/core", () => {
  for (const file of MIRRORED) {
    test(`${file} is byte-identical to core`, () => {
      const core = fs.readFileSync(path.join(CORE, file), "utf-8");
      const vendored = fs.readFileSync(path.join(VENDORED, file), "utf-8");
      expect(vendored).toBe(core);
    });
  }
});
