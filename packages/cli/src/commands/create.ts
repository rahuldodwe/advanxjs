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
import {
  PAGE_ABOUT_LOGIC,
  PAGE_ABOUT_STYLE,
  PAGE_ABOUT_VIEW,
  PAGE_INDEX_LOGIC,
  PAGE_INDEX_STYLE,
  PAGE_INDEX_VIEW,
} from "../templates/pages.ts";
import RUNTIME from "../templates/core/runtime.ts" with { type: "text" };
import DIRECTIVES from "../templates/core/directives.ts" with { type: "text" };
import ROUTER from "../templates/core/router.ts" with { type: "text" };

export async function run(args: string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    console.error("Usage: advanx create <project-name>");
    process.exit(1);
  }

  const root = path.resolve(process.cwd(), name);
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
  write("src/lib/advanx/router.ts", ROUTER);

  // Example file-system SPA (pages mode). `advanx build`/`export` at the project
  // root detects src/pages and wires these routes via the router.
  write("src/pages/index/logic.ts", PAGE_INDEX_LOGIC);
  write("src/pages/index/view.html", PAGE_INDEX_VIEW);
  write("src/pages/index/style.css", PAGE_INDEX_STYLE);
  write("src/pages/about/logic.ts", PAGE_ABOUT_LOGIC);
  write("src/pages/about/view.html", PAGE_ABOUT_VIEW);
  write("src/pages/about/style.css", PAGE_ABOUT_STYLE);

  console.log(`✔ Scaffolded AdvanxJS project at ${root}`);
  for (const rel of written) console.log(`  + ${rel}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${name}`);
  console.log("  bun install");
  console.log("");
  console.log("  # Component mode — build a single component:");
  console.log("  advanx build src/components/counter");
  console.log("  advanx explain src/components/counter");
  console.log("");
  console.log("  # Pages mode — build the file-system SPA + static export:");
  console.log("  advanx build");
  console.log("  advanx export");
}
