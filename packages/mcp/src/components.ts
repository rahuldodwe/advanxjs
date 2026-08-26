import { readdir } from "fs/promises";
import { join } from "path";

const TRINITY = ["logic.ts", "view.html", "style.css"];

/** Article I — a directory is a component iff it holds the full Trinity. */
export async function isComponentDir(dir: string): Promise<boolean> {
  const files = await readdir(dir).catch(() => [] as string[]);
  return TRINITY.every((f) => files.includes(f));
}

/** Component names under `dir`, sorted; non-components are excluded. */
export async function listComponentDirs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const checks = await Promise.all(dirs.map((n) => isComponentDir(join(dir, n))));
  return dirs.filter((_, i) => checks[i]).sort();
}
