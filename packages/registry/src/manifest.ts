/**
 * Component metadata schema for registry components
 */
export interface ComponentManifest {
  name: string;
  version: string;
  description: string;
  tags: string[];
  tier: "free" | "premium";
  suggestedFor: ("spa" | "multi-page" | "component")[];
}

/**
 * Resolved component with all files
 */
export interface ResolvedComponent {
  manifest: ComponentManifest;
  files: {
    "logic.ts": string;
    "view.html": string;
    "style.css": string;
  };
}

/**
 * Component listing entry
 */
export interface ComponentListEntry {
  name: string;
  description: string;
  tags: string[];
  tier: "free" | "premium";
}
