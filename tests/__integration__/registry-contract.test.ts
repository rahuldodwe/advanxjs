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
