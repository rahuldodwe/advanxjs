import fs from "fs";
import path from "path";
import { CONSTITUTION } from "../templates/constitution.ts";
import { GITIGNORE, TSCONFIG, packageJson, readme } from "../templates/project.ts";
import {
  COUNTER_INDEX_HTML,
  COUNTER_LOGIC,
  COUNTER_STYLE,
  COUNTER_VIEW,
} from "../templates/counter.ts";
import { RUNTIME, DIRECTIVES } from "../templates/framework.ts";

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
  write("index.html", COUNTER_INDEX_HTML);

  write("src/components/counter/logic.ts", COUNTER_LOGIC);
  write("src/components/counter/view.html", COUNTER_VIEW);
  write("src/components/counter/style.css", COUNTER_STYLE);

  write("src/lib/advanx/runtime.ts", RUNTIME);
  write("src/lib/advanx/directives.ts", DIRECTIVES);

  console.log(`✔ Scaffolded AdvanxJS project at ${root}`);
  for (const rel of written) console.log(`  + ${rel}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${name}`);
  console.log("  bun install");
  console.log("  advanx build src/components/counter");
  console.log("  advanx explain src/components/counter");
}
