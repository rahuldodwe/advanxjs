import fs from "fs";
import path from "path";
import { compileComponent, compilePages } from "../../../compiler/src/index.ts";
import { prerenderComponent, prerenderPages } from "../../../compiler/src/ssr.ts";

// `advanx export` is a superset of `advanx build`: it runs the full compile
// (validation + .advanx-meta.json + bundle.js) and then pre-renders the HTML so
// the static file already contains the content. Host the output anywhere.

function parseArgs(args: string[]): { target: string; out: string | null; hasTarget: boolean } {
  let target: string | undefined;
  let out: string | null = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--out" || a === "-o") {
      out = args[++i] ?? null;
    } else if (a.startsWith("--out=")) {
      out = a.slice("--out=".length);
    } else if (!target) {
      target = a;
    }
  }
  return {
    target: path.resolve(target ?? "."),
    out: out ? path.resolve(out) : null,
    hasTarget: target !== undefined,
  };
}

function copyBundle(fromDist: string, outDir: string): void {
  const src = path.join(fromDist, "bundle.js");
  if (fs.existsSync(src)) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.copyFileSync(src, path.join(outDir, "bundle.js"));
  }
}

export async function run(args: string[]): Promise<void> {
  const { target, out, hasTarget } = parseArgs(args);

  try {
    const pagesDir = path.join(target, "src", "pages");
    const isSpa = fs.existsSync(pagesDir);
    const builtDist = path.join(target, "dist");
    const outDir = out ?? builtDist;

    if (isSpa) {
      await compilePages(target);
      if (outDir !== builtDist) copyBundle(builtDist, outDir);
      const count = await prerenderPages(target, outDir);
      console.log(`✔ AdvanxJS: Exported ${count} static page(s) → ${path.relative(process.cwd(), outDir) || "."}`);
    } else {
      if (!hasTarget) {
        console.error("Usage: advanx export <component-folder|spa-root> [--out <dir>]");
        process.exit(1);
      }
      await compileComponent(target);
      if (outDir !== builtDist) copyBundle(builtDist, outDir);
      await prerenderComponent(target, outDir);
      console.log(`✔ AdvanxJS: Exported static site → ${path.relative(process.cwd(), outDir) || "."}`);
    }
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}
