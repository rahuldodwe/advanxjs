import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CONSTITUTION } from "../templates/constitution.ts";
import { GITIGNORE, TSCONFIG, packageJson, readme } from "../templates/project.ts";
import {
  COUNTER_INDEX_HTML,
  COUNTER_LOGIC,
  COUNTER_STYLE,
  COUNTER_VIEW,
} from "../templates/counter.ts";

export async function run(args: string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    console.error("Usage: advanx create <project-name>");
    process.exit(1);
  }

  const root = path.resolve(name);
  if (fs.existsSync(root)) {
    console.error(`🚨 Refusing to overwrite existing path: ${root}`);
    process.exit(1);
  }

  const written: string[] = [];
  const write = (rel: string, body: string) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
    written.push(rel);
  };

  write("CONSTITUTION.md", CONSTITUTION);
  write("package.json", packageJson(name));
  write("tsconfig.json", TSCONFIG);
  write(".gitignore", GITIGNORE);
  write("README.md", readme(name));
  write("packages/.gitkeep", "");

  const runtime = readFrameworkFile("runtime.ts");
  const directives = readFrameworkFile("directives.ts");
  write("packages/core/src/runtime.ts", runtime);
  write("packages/core/src/directives.ts", directives);

  write("tests/counter/logic.ts", COUNTER_LOGIC);
  write("tests/counter/view.html", COUNTER_VIEW);
  write("tests/counter/style.css", COUNTER_STYLE);
  write("tests/counter/dist/index.html", COUNTER_INDEX_HTML);

  console.log(`✔ Scaffolded AdvanxJS project at ${root}`);
  for (const rel of written) console.log(`  + ${rel}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${name}`);
  console.log("  bun install");
  console.log("  advanx build tests/counter");
  console.log("  advanx explain tests/counter");
}

function readFrameworkFile(filename: string): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const corePath = path.resolve(here, "..", "..", "..", "core", "src", filename);
  if (!fs.existsSync(corePath)) {
    throw new Error(
      `🚨 Framework runtime not found at ${corePath}. ` +
        `Run \`advanx create\` from a checkout of the AdvanxJS monorepo.`
    );
  }
  return fs.readFileSync(corePath, "utf-8");
}
