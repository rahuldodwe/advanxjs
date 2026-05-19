/**
 * AdvanxJS Component Registry
 *
 * Provides access to pre-built components that can be installed via `advanx add`
 */

import type { ComponentListEntry, ResolvedComponent } from "./manifest.ts";
import {
  listComponents,
  resolveComponent,
  componentExists,
} from "./sources/local.ts";
import {
  listComponentsRemote,
  resolveComponentRemote,
  componentExistsRemote,
} from "./sources/remote.ts";

export type {
  ComponentManifest,
  ResolvedComponent,
  ComponentListEntry,
} from "./manifest.ts";

export {
  listComponents,
  resolveComponent,
  componentExists,
} from "./sources/local.ts";

export {
  listComponentsRemote,
  resolveComponentRemote,
  componentExistsRemote,
} from "./sources/remote.ts";

/**
 * List components with remote fallback
 * Returns local components merged with remote (remote fills gaps)
 */
export async function listComponentsWithFallback(): Promise<ComponentListEntry[]> {
  const local = listComponents();
  const localNames = new Set(local.map((c) => c.name));

  try {
    const remote = await listComponentsRemote();
    // Add remote components that aren't available locally
    for (const comp of remote) {
      if (!localNames.has(comp.name)) {
        local.push(comp);
      }
    }
  } catch {
    // Network error - just use local
  }

  return local;
}

/**
 * Resolve component with remote fallback
 * Tries local first, then remote if not found
 */
export async function resolveComponentWithFallback(name: string): Promise<ResolvedComponent | null> {
  // Try local first
  const local = resolveComponent(name);
  if (local) {
    return local;
  }

  // Fall back to remote
  try {
    return await resolveComponentRemote(name);
  } catch {
    return null;
  }
}

/**
 * Check if component exists with remote fallback
 * Checks local first, then remote if not found
 */
export async function componentExistsWithFallback(name: string): Promise<boolean> {
  // Try local first
  if (componentExists(name)) {
    return true;
  }

  // Fall back to remote
  try {
    return await componentExistsRemote(name);
  } catch {
    return false;
  }
}
