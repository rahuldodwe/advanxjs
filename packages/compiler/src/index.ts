import fs from "fs";
import path from "path";
import { analyzeLogic } from "./analyze";
import { parseView } from "./parseView";
import { validateBindings } from "./validate";

export async function compileComponent(dir: string) {
  const view = fs.readFileSync(path.join(dir, "view.html"), "utf-8");
  const logicCode = fs.readFileSync(path.join(dir, "logic.ts"), "utf-8");
  const style = fs.readFileSync(path.join(dir, "style.css"), "utf-8");

  const logic = analyzeLogic(logicCode);
  const bindings = parseView(view);
  validateBindings(bindings, logic);

  // Article VIII — Self-Mapping metadata
  const metadata = {
    component: path.basename(dir),
    signals: logic.signals,
    computed: logic.computed,
    actions: logic.actions,
    structure: {
      mustaches: bindings.mustaches,
      conditionals: bindings.conditionals,
      events: bindings.events,
      loops: bindings.loops,
      models: bindings.models,
    },
    tokens_hint: "This component is AdvanxJS compliant. Logic and View are decoupled.",
  };
  fs.writeFileSync(path.join(dir, ".advanx-meta.json"), JSON.stringify(metadata, null, 2));

  const dist = path.join(dir, "dist");
  if (!fs.existsSync(dist)) fs.mkdirSync(dist);

  // Article III — Static by Default. Skip the runtime when nothing is reactive.
  const isStatic =
    bindings.mustaches.length === 0 &&
    bindings.conditionals.length === 0 &&
    bindings.events.length === 0 &&
    bindings.loops.length === 0 &&
    bindings.models.length === 0;

  const glue = isStatic
    ? `const styleTag = document.createElement("style");
styleTag.innerHTML = ${JSON.stringify(style)};
document.head.appendChild(styleTag);
const app = document.getElementById("app");
if (app) app.innerHTML = ${JSON.stringify(view)};
`
    : `import * as logic from "../logic.ts";
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
    format: "iife",
  });
  if (!result.success) throw new Error("Build failed");
}
