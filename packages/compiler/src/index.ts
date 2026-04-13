import fs from "fs";
import path from "path";
import { validateBindings } from "./validate";

export async function compileComponent(dir: string) {
  const view = fs.readFileSync(path.join(dir, "view.html"), "utf-8");
  const logicPath = path.join(dir, "logic.ts");
  const logicCode = fs.readFileSync(logicPath, "utf-8");
  const style = fs.readFileSync(path.join(dir, "style.css"), "utf-8");

  // 1. Extract Exports
  const exports = [...logicCode.matchAll(/export\s+(const|function)\s+(\w+)/g)].map(m => m[2]);

  // 2. Validate Contract
  validateBindings(view, exports);

  // 3. Prepare Build
  const dist = path.join(dir, "dist");
  if (!fs.existsSync(dist)) fs.mkdirSync(dist);

  // This is the glue code that connects everything
  const glue = `
    import * as logic from "../logic.ts";
    import { mount } from "../../../packages/core/src/runtime.ts";

    const styleTag = document.createElement("style");
    styleTag.innerHTML = \`${style}\`;
    document.head.appendChild(styleTag);

    const appDiv = document.getElementById("app");
    if (appDiv) {
      appDiv.innerHTML = \`${view}\`;
      mount(appDiv, logic);
    }
  `;

  const entryPath = path.join(dist, "entry.ts");
  fs.writeFileSync(entryPath, glue);

  const result = await Bun.build({
    entrypoints: [entryPath],
    outdir: dist,
    naming: "bundle.js",
  });

  if (!result.success) {
    console.error("🚨 Bun Build Failed!");
    console.log(result.logs);
    throw new Error("Build process failed.");
  }
}
