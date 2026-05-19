/**
 * Remote registry source - fetches components from GitHub
 */
import type { ComponentManifest, ResolvedComponent, ComponentListEntry } from "../manifest.ts";

const REGISTRY_BASE = "https://raw.githubusercontent.com/AgnuxVertique/advanxjs/main/packages/registry";
const REGISTRY_INDEX = `${REGISTRY_BASE}/registry.json`;

interface RegistryIndex {
  version: string;
  components: ComponentListEntry[];
}

/**
 * Fetch and parse the remote registry index
 */
export async function fetchRegistryIndex(): Promise<RegistryIndex | null> {
  try {
    const response = await fetch(REGISTRY_INDEX);
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
  const componentBase = `${REGISTRY_BASE}/components/${name}`;

  try {
    // Fetch all component files in parallel
    const [manifestRes, logicRes, viewRes, styleRes] = await Promise.all([
      fetch(`${componentBase}/component.json`),
      fetch(`${componentBase}/logic.ts`),
      fetch(`${componentBase}/view.html`),
      fetch(`${componentBase}/style.css`),
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
