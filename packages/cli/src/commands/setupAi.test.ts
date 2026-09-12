import { afterAll, describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";

// Spawn the CLI the way tests/__integration__/compile.test.ts does rather than
// importing run(): the command calls process.exit on bad input, and subprocess
// runs match how a user actually invokes it.
const REPO = path.resolve(import.meta.dir, "../../../..");
const CLI = path.join(REPO, "packages", "cli", "src", "index.ts");

// Scratch dirs stay inside the repo, never os.tmpdir() — house convention.
const SCRATCH = fs.mkdtempSync(path.join(import.meta.dir, "setup-ai-"));
afterAll(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

let n = 0;
function freshDir(): string {
  const dir = path.join(SCRATCH, `case-${n++}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function setupAi(dir: string, ...flags: string[]) {
  const r = Bun.spawnSync([process.execPath, CLI, "setup-ai", dir, ...flags]);
  return {
    exitCode: r.exitCode,
    stdout: new TextDecoder().decode(r.stdout),
    stderr: new TextDecoder().decode(r.stderr),
  };
}

const read = (dir: string, f: string) =>
  fs.readFileSync(path.join(dir, f), "utf-8");

describe("advanx setup-ai", () => {
  test("creates .cursorrules and .mcp.json in an empty directory", () => {
    const dir = freshDir();
    const r = setupAi(dir);
    expect(r.stderr).toBe("");
    expect(r.exitCode).toBe(0);
    expect(fs.existsSync(path.join(dir, ".cursorrules"))).toBe(true);
    expect(fs.existsSync(path.join(dir, ".mcp.json"))).toBe(true);
    expect(r.stdout).toContain("🤖 AdvanxJS AI Setup Complete!");
  });

  test(".mcp.json is valid JSON registering the advanx server", () => {
    const dir = freshDir();
    setupAi(dir);
    const cfg = JSON.parse(read(dir, ".mcp.json"));
    expect(cfg.mcpServers.advanx.command).toBeString();
    expect(cfg.mcpServers.advanx.args).toContain("mcp");
  });

  // Article V — the cheatsheet must not advertise syntax the compiler rejects.
  test(".cursorrules states the Trinity and the unsupported syntax", () => {
    const dir = freshDir();
    setupAi(dir);
    const rules = read(dir, ".cursorrules");
    for (const f of ["logic.ts", "view.html", "style.css"]) {
      expect(rules).toContain(f);
    }
    // The honesty section must keep naming what the compiler actually rejects.
    expect(rules).toContain("DOES NOT WORK YET");
    expect(rules).toContain("attribute mustaches");
    expect(rules).toContain("orphan ax-else");
    // ...and the directives that DO work must be documented as such.
    expect(rules).toContain("ax-bind:");
    expect(rules).toContain("ax-else takes no value");
    expect(rules).not.toContain("\\`");
  });

  test("preserves existing files without --force", () => {
    const dir = freshDir();
    fs.writeFileSync(path.join(dir, ".cursorrules"), "KEEP ME");
    const r = setupAi(dir);
    expect(r.exitCode).toBe(0);
    expect(read(dir, ".cursorrules")).toBe("KEEP ME");
    expect(r.stdout).toContain("--force");
    // The file it did not have is still created.
    expect(fs.existsSync(path.join(dir, ".mcp.json"))).toBe(true);
  });

  test("--force overwrites existing files", () => {
    const dir = freshDir();
    fs.writeFileSync(path.join(dir, ".cursorrules"), "KEEP ME");
    const r = setupAi(dir, "--force");
    expect(r.exitCode).toBe(0);
    expect(read(dir, ".cursorrules")).not.toBe("KEEP ME");
    expect(read(dir, ".cursorrules")).toContain("Lead Architect");
  });

  test("--force keeps other mcpServers entries intact", () => {
    const dir = freshDir();
    fs.writeFileSync(
      path.join(dir, ".mcp.json"),
      JSON.stringify({ mcpServers: { other: { command: "echo" } } })
    );
    setupAi(dir, "--force");
    const cfg = JSON.parse(read(dir, ".mcp.json"));
    expect(cfg.mcpServers.other.command).toBe("echo");
    expect(cfg.mcpServers.advanx).toBeDefined();
  });

  test("exits non-zero on a missing directory", () => {
    const r = setupAi(path.join(SCRATCH, "does-not-exist"));
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("No such directory");
  });
});
