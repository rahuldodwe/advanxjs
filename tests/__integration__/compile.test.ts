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

// The Honesty Compiler, end to end: `ax-else` and attribute mustaches parse
// cleanly but are inert at runtime, so the build must stop rather than print
// "Contract Satisfied". Exit code AND message are both asserted — a build that
// fails for the wrong reason is still a broken promise.
describe("unimplemented syntax fails the build with the exact message", () => {
  // Sits beside the fixtures rather than under __integration__: compileComponent
  // emits a fixed `../../../packages/core/src/runtime.ts` into dist/entry.ts, so
  // a component only resolves the monorepo runtime at exactly this depth.
  const dir = fs.mkdtempSync(path.join(REPO, "tests", "unsupported-"));
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  // Resolvable runtime import: the rejection cases stop at validation, but the
  // passing case goes on to bundle, so this has to be the real module.
  const LOGIC =
    `import { signal } from "../../packages/core/src/runtime.ts";\n` +
    `export const flag = signal(true);\n` +
    `export const url = signal("/docs");\n`;

  function build(view: string) {
    fs.writeFileSync(path.join(dir, "logic.ts"), LOGIC);
    fs.writeFileSync(path.join(dir, "view.html"), view);
    fs.writeFileSync(path.join(dir, "style.css"), ``);
    const r = Bun.spawnSync([process.execPath, CLI, "build", dir]);
    return {
      exitCode: r.exitCode,
      stderr: new TextDecoder().decode(r.stderr),
      stdout: new TextDecoder().decode(r.stdout),
    };
  }

  test("ax-else exits 1 and prints the ax-else violation", () => {
    const r = build(`<p ax-if="flag">Y</p>\n<p ax-else>N</p>\n`);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain(
      "🚨 ADVANXJS CONTRACT VIOLATION: 'ax-else' is not yet supported in the runtime. " +
      "Use inverted 'ax-if' booleans in logic.ts (Article I/V).",
    );
    expect(r.stdout).not.toContain("Contract Satisfied");
  });

  test("an attribute mustache exits 1 and prints the attribute violation", () => {
    const r = build(`<img src="{{ url }}" alt="x" />\n`);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain(
      "🚨 ADVANXJS CONTRACT VIOLATION: Attribute mustache interpolation is not yet supported. " +
      "Use direct element bindings or directives (Article V).",
    );
    expect(r.stdout).not.toContain("Contract Satisfied");
  });

  test("no .advanx-meta.json is emitted for a rejected view (Article VIII)", () => {
    build(`<img src="{{ url }}" alt="x" />\n`);
    expect(fs.existsSync(path.join(dir, ".advanx-meta.json"))).toBe(false);
  });

  test("the same view with a static attribute builds cleanly", () => {
    const r = build(`<a ax-link="/docs">{{ url }}</a>\n`);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("Contract Satisfied");
  });
});
