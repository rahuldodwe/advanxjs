import fs from "fs";
import path from "path";
import { CURSORRULES } from "../templates/cursorrules.ts";

interface Options {
  dir: string;
  force: boolean;
}

function parseArgs(args: string[]): Options {
  let dir: string | undefined;
  let force = false;
  for (const a of args) {
    if (a === "--force" || a === "-f") force = true;
    else if (!dir) dir = a;
  }
  return { dir: path.resolve(dir ?? process.cwd()), force };
}

/**
 * The `advanx` MCP server entry the generated .mcp.json should launch.
 * Inside the Advanx monorepo itself we point at the local source so this repo's
 * own config never round-trips through npm; everywhere else the published
 * binary owns the command.
 */
function mcpServerEntry(dir: string): { command: string; args: string[] } {
  const local = path.join(dir, "packages", "mcp", "src", "server.ts");
  if (fs.existsSync(local)) {
    return { command: "bun", args: ["packages/cli/src/index.ts", "mcp"] };
  }
  return { command: "bunx", args: ["advanxjs", "mcp"] };
}

/**
 * Build the .mcp.json body. When overwriting, keep every other server the user
 * already registered — we only own the `advanx` key.
 */
function mcpConfig(dir: string, existing: string | null): string {
  let base: any = {};
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed && typeof parsed === "object") base = parsed;
    } catch {
      // Not valid JSON — fall through to a clean file rather than guess.
    }
  }
  if (!base.mcpServers || typeof base.mcpServers !== "object") base.mcpServers = {};
  base.mcpServers.advanx = mcpServerEntry(dir);
  return JSON.stringify(base, null, 2) + "\n";
}

export async function run(args: string[]): Promise<void> {
  const { dir, force } = parseArgs(args);

  if (!fs.existsSync(dir)) {
    console.error(`🚨 No such directory: ${dir}`);
    process.exit(1);
  }

  const written: string[] = [];
  const skipped: string[] = [];

  // Unlike `advanx create`, setup-ai is meant to be re-runnable on an existing
  // project: an existing file is left byte-identical unless --force is passed.
  const write = (rel: string, body: (existing: string | null) => string) => {
    const abs = path.join(dir, rel);
    const exists = fs.existsSync(abs);
    if (exists && !force) {
      skipped.push(rel);
      return;
    }
    const existing = exists ? fs.readFileSync(abs, "utf-8") : null;
    fs.writeFileSync(abs, body(existing));
    written.push(rel);
  };

  write(".cursorrules", () => CURSORRULES);
  write(".mcp.json", existing => mcpConfig(dir, existing));

  console.log("🤖 AdvanxJS AI Setup Complete!");
  console.log("");
  for (const rel of written) console.log(`  + ${rel}`);
  for (const rel of skipped) {
    console.log(`  · ${rel} (exists — pass --force to overwrite)`);
  }
  console.log("");
  console.log("💡 Cursor:      reload the window — .cursorrules loads automatically.");
  console.log("💡 Claude Code: run `claude` here and approve the `advanx` MCP server.");
}
