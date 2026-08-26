/**
 * Remote registry source - fetches components from GitHub
 */
import type { ComponentManifest, ResolvedComponent, ComponentListEntry } from "../manifest.ts";

/** The registry lives in the repo this package publishes from. Keep in sync with
 *  the root package.json `repository.url` — remote.test.ts enforces it. */
export const DEFAULT_REGISTRY_BASE =
  "https://raw.githubusercontent.com/rahuldodwe/advanxjs/main/packages/registry";

/** Base URL with any trailing slashes stripped, so joins never emit `//`.
 *  Overridable via ADVANX_REGISTRY_BASE for forks and mirrors. */
export function registryBase(): string {
  return (process.env.ADVANX_REGISTRY_BASE ?? DEFAULT_REGISTRY_BASE).replace(/\/+$/, "");
}

export function registryUrl(...segments: string[]): string {
  return [registryBase(), ...segments].join("/");
}

interface RegistryIndex {
  version: string;
  components: ComponentListEntry[];
}

/**
 * Fetch and parse the remote registry index
 */
export async function fetchRegistryIndex(): Promise<RegistryIndex | null> {
  try {
    const response = await fetch(registryUrl("registry.json"));
    if (!response.ok) {
      return null;
    }
    return await response.json() as RegistryIndex;
  } catch {
    return null;
  }
}

/**
 * List all available components from the remote registry
 */
export async function listComponentsRemote(): Promise<ComponentListEntry[]> {
  const index = await fetchRegistryIndex();
  if (!index) {
    return [];
  }
  return index.components;
}

/**
 * Check if a component exists in the remote registry
 */
export async function componentExistsRemote(name: string): Promise<boolean> {
  const index = await fetchRegistryIndex();
  if (!index) {
    return false;
  }
  return index.components.some((c) => c.name === name);
}

/**
 * Resolve a component by name from the remote registry
 */
export async function resolveComponentRemote(name: string): Promise<ResolvedComponent | null> {
  const file = (f: string) => registryUrl("components", name, f);

  try {
    // Fetch all component files in parallel
    const [manifestRes, logicRes, viewRes, styleRes] = await Promise.all([
      fetch(file("component.json")),
      fetch(file("logic.ts")),
      fetch(file("view.html")),
      fetch(file("style.css")),
    ]);

    // Check if all files exist
    if (!manifestRes.ok || !logicRes.ok || !viewRes.ok || !styleRes.ok) {
      return null;
    }

    // Parse manifest and read files
    const manifest: ComponentManifest = await manifestRes.json();
    const [logic, view, style] = await Promise.all([
      logicRes.text(),
      viewRes.text(),
      styleRes.text(),
    ]);

    return {
      manifest,
      files: {
        "logic.ts": logic,
        "view.html": view,
        "style.css": style,
      },
    };
  } catch {
    return null;
  }
}
