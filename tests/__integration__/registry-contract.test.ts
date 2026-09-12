import { describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";
import { analyzeLogic } from "../../packages/compiler/src/analyze.ts";
import { parseView } from "../../packages/compiler/src/parseView.ts";
import { validateBindings } from "../../packages/compiler/src/validate.ts";

// Nothing used to compile the registry components, which is how `navbar` and
// `hero-simple` shipped with `ax-link="{{ … }}"` — markup the runtime never
// interpolates, so every link silently routed to "/". `advanx add <name>` drops
// these straight into a user's project, so they must satisfy the same contract
// as any component the user writes.

const REPO = path.resolve(import.meta.dir, "../..");
const COMPONENTS = path.join(REPO, "packages", "registry", "components");

const names = fs
  .readdirSync(COMPONENTS, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => e.name)
  .sort();

describe("registry components satisfy the compiler contract", () => {
  test("the registry is not empty", () => {
    expect(names.length).toBeGreaterThan(0);
  });

  for (const name of names) {
    test(`${name} validates`, () => {
      const dir = path.join(COMPONENTS, name);
      const logic = analyzeLogic(fs.readFileSync(path.join(dir, "logic.ts"), "utf-8"));
      const view = parseView(fs.readFileSync(path.join(dir, "view.html"), "utf-8"));
      expect(() => validateBindings(view, logic)).not.toThrow();
    });

    test(`${name} holds the Trinity (Article I)`, () => {
      const dir = path.join(COMPONENTS, name);
      for (const f of ["logic.ts", "view.html", "style.css"]) {
        expect(fs.existsSync(path.join(dir, f))).toBe(true);
      }
    });
  }
});

describe("every component in registry.json exists on disk", () => {
  const index = JSON.parse(
    fs.readFileSync(path.join(REPO, "packages", "registry", "registry.json"), "utf-8"),
  ) as { components: { name: string }[] };

  for (const { name } of index.components) {
    test(`${name} is present`, () => {
      expect(names).toContain(name);
    });
  }
});

// Article II, "One Brain". Registry components used to import
// "@preact/signals-core" directly. With a second copy of that package resolvable
// (packages/core/node_modules), a component's signals came from a different
// module instance than the runtime's `effect` — so nothing it rendered ever
// updated. Every component initial-rendered fine, which is why it went unseen
// until spotlight-card needed live pointer state. The import path below is the
// one that resolves BOTH here and at src/components/<name>/ in a scaffolded app.
describe("registry components share the runtime instance (Article II)", () => {
  for (const name of names) {
    test(`${name} imports from the advanx runtime, not signals-core`, () => {
      const logic = fs.readFileSync(
        path.join(COMPONENTS, name, "logic.ts"), "utf-8",
      );
      expect(logic).not.toContain("@preact/signals-core");
      if (/\b(signal|computed|effect)\s*\(/.test(logic)) {
        expect(logic).toContain(`from "../../lib/advanx/runtime.ts"`);
      }
    });
  }

  test("that import path resolves inside the monorepo too", () => {
    expect(fs.existsSync(
      path.join(REPO, "packages", "registry", "lib", "advanx", "runtime.ts"),
    )).toBe(true);
  });
});
