import { afterAll, describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";
import { analyzeLogic } from "../../packages/compiler/src/analyze.ts";
import { parseView } from "../../packages/compiler/src/parseView.ts";
import { validateBindings } from "../../packages/compiler/src/validate.ts";

const REPO = path.resolve(import.meta.dir, "../..");
const CLI = path.join(REPO, "packages", "cli", "src", "index.ts");
const fixtures = ["counter", "form", "todos", "toggle", "static"];

// The contract layer is deterministic and runs in-process. The real bundler is
// exercised via a CLI subprocess: Bun.build misbehaves when called inside the
// `bun test` runtime, so a fresh Bun runtime is both a workaround and a truer
// end-to-end check.

describe("contract layer — every fixture satisfies its Article V contract", () => {
  for (const name of fixtures) {
    test(`tests/${name} validates + maps its bindings`, () => {
      const dir = path.join(REPO, "tests", name);
      const logic = analyzeLogic(fs.readFileSync(path.join(dir, "logic.ts"), "utf-8"));
      const view = parseView(fs.readFileSync(path.join(dir, "view.html"), "utf-8"));
      expect(() => validateBindings(view, logic)).not.toThrow();
    });
  }
});

describe("end-to-end build (real Bun bundler via CLI subprocess)", () => {
  test("`advanx build tests/counter` emits Article VIII meta + hydration bundle", () => {
    const dir = path.join(REPO, "tests", "counter");
    const r = Bun.spawnSync([process.execPath, CLI, "build", dir]);
    expect(r.exitCode).toBe(0);
    expect(fs.existsSync(path.join(dir, ".advanx-meta.json"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "dist", "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "dist", "bundle.js"))).toBe(true);
  });
});

describe("Article V — a broken contract fails the build", () => {
  const brokenDir = fs.mkdtempSync(path.join(import.meta.dir, "broken-"));
  afterAll(() => fs.rmSync(brokenDir, { recursive: true, force: true }));

  test("validateBindings throws on an undeclared symbol", () => {
    const logic = analyzeLogic(`import { signal } from "x";\nexport const count = signal(0);\n`);
    const view = parseView(`<p>{{ ghost }}</p>`);
    expect(() => validateBindings(view, logic)).toThrow(/CONTRACT VIOLATION/);
  });

  test("`advanx build` exits non-zero on a broken contract", () => {
    fs.writeFileSync(
      path.join(brokenDir, "logic.ts"),
      `import { signal } from "x";\nexport const count = signal(0);\n`,
    );
    fs.writeFileSync(path.join(brokenDir, "view.html"), `<p>{{ ghost }}</p>`);
    fs.writeFileSync(path.join(brokenDir, "style.css"), ``);
    const r = Bun.spawnSync([process.execPath, CLI, "build", brokenDir]);
    expect(r.exitCode).not.toBe(0);
  });
});
