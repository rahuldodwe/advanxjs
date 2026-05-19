import fs from "fs";
import path from "path";
import type { ComponentManifest, ResolvedComponent, ComponentListEntry } from "../manifest.ts";

const COMPONENTS_DIR = path.join(import.meta.dirname, "../../components");

/**
 * List all available components in the local registry
 */
export function listComponents(): ComponentListEntry[] {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    return [];
  }

  const entries: ComponentListEntry[] = [];
  const dirs = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const manifestPath = path.join(COMPONENTS_DIR, dir.name, "component.json");
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest: ComponentManifest = JSON.parse(
        fs.readFileSync(manifestPath, "utf-8")
      );
      entries.push({
        name: manifest.name,
        description: manifest.description,
        tags: manifest.tags,
        tier: manifest.tier,
      });
    } catch {
      // Skip malformed manifests
    }
  }

  return entries;
}

/**
 * Resolve a component by name from the local registry
 */
export function resolveComponent(name: string): ResolvedComponent | null {
  const componentDir = path.join(COMPONENTS_DIR, name);

  if (!fs.existsSync(componentDir)) {
    return null;
  }

  const manifestPath = path.join(componentDir, "component.json");
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const manifest: ComponentManifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf-8")
    );

    const logicPath = path.join(componentDir, "logic.ts");
    const viewPath = path.join(componentDir, "view.html");
    const stylePath = path.join(componentDir, "style.css");

    if (!fs.existsSync(logicPath) || !fs.existsSync(viewPath) || !fs.existsSync(stylePath)) {
      return null;
    }

    return {
      manifest,
      files: {
        "logic.ts": fs.readFileSync(logicPath, "utf-8"),
        "view.html": fs.readFileSync(viewPath, "utf-8"),
        "style.css": fs.readFileSync(stylePath, "utf-8"),
      },
    };
  } catch {
    return null;
  }
}

/**
 * Check if a component exists in the registry
 */
export function componentExists(name: string): boolean {
  const componentDir = path.join(COMPONENTS_DIR, name);
  const manifestPath = path.join(componentDir, "component.json");
  return fs.existsSync(manifestPath);
}
