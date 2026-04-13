import fs from "fs";
import path from "path";
import { validateBindings } from "./validate";

export async function compileComponent(dir: string) {
  const view = fs.readFileSync(path.join(dir, "view.html"), "utf-8");
  const logicPath = path.join(dir, "logic.ts");
  const logicCode = fs.readFileSync(logicPath, "utf-8");
  const style = fs.readFileSync(path.join(dir, "style.css"), "utf-8");

  const exports = [...logicCode.matchAll(/export\s+(const|function|class)\s+(\w+)/g)].map(m => m[2]);
  const { mustacheBindings, ifBindings } = validateBindings(view, exports);

  // ARTICLE VIII: SELF-MAPPING METADATA
  const metadata = {
    component: path.basename(dir),
    signals: exports.filter(e => logicCode.includes(`${e} = signal`) || logicCode.includes(`${e} = computed`)),
    actions: exports.filter(e => logicCode.includes(`function ${e}`) || logicCode.includes(`${e} = (`)),
    structure: { mustaches: mustacheBindings, conditionals: ifBindings },
    tokens_hint: "This component is AdvanxJS compliant. Logic and View are decoupled."
  };
  fs.writeFileSync(path.join(dir, ".advanx-meta.json"), JSON.stringify(metadata, null, 2));

  const dist = path.join(dir, "dist");
  if (!fs.existsSync(dist)) fs.mkdirSync(dist);

  const glue = `
    import * as logic from "../logic.ts";
    import { bootstrap } from "../../../packages/core/src/runtime.ts";
    const view = ${JSON.stringify(view)};
    const style = ${JSON.stringify(style)};
    bootstrap(view, style, logic);
  `;

  fs.writeFileSync(path.join(dist, "entry.ts"), glue);
  const result = await Bun.build({
    entrypoints: [path.join(dist, "entry.ts")],
    outdir: dist,
    naming: "bundle.js",
  });
  if (!result.success) throw new Error("Build failed");
}
