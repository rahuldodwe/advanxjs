/**
 * AdvanxJS Component Registry
 *
 * Provides access to pre-built components that can be installed via `advanx add`
 */

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
