export interface ViewBindings {
  /** Text-node mustaches only — the ones the runtime actually interpolates. */
  mustaches: string[];
  /** Mustaches sitting in attribute position. The runtime never resolves these. */
  attributeMustaches: { attribute: string; expression: string }[];
  conditionals: string[];
  events: { event: string; handler: string }[];
  loops: { alias: string; source: string }[];
  models: string[];
  /** Occurrences of `ax-else`, which the runtime does not implement. */
  elses: number;
}

const MUSTACHE = /\{\{\s*([\w.]+)\s*\}\}/g;
const AX_ELSE = /\bax-else\b/g;
const ATTR_BEFORE = /([\w:.\-]+)\s*=\s*["'][^"']*$/;

// Position-based rather than a full HTML parse: `wireMustaches` and `hydrateClone`
// walk NodeFilter.SHOW_TEXT only, so where a token sits decides whether it is a
// live binding or dead markup. Limitation: a literal `>` inside an attribute value
// ahead of the token confuses this — consistent with the regexes below.

/** True when `index` sits between a tag's angle brackets rather than in text. */
function insideTag(html: string, index: number): boolean {
  return html.lastIndexOf("<", index) > html.lastIndexOf(">", index);
}

/** Name of the attribute whose value contains the token at `index`, if any. */
function attributeAt(html: string, index: number): string | null {
  const tagStart = html.lastIndexOf("<", index);
  if (tagStart === -1) return null;
  return html.slice(tagStart, index).match(ATTR_BEFORE)?.[1] ?? null;
}

export function parseView(html: string): ViewBindings {
  const mustaches: string[] = [];
  const attributeMustaches: { attribute: string; expression: string }[] = [];

  for (const m of html.matchAll(MUSTACHE)) {
    const path = m[1]!;
    if (insideTag(html, m.index!)) {
      attributeMustaches.push({
        attribute: attributeAt(html, m.index!) ?? "(unknown)",
        expression: path,
      });
    } else {
      mustaches.push(path);
    }
  }

  return {
    mustaches,
    attributeMustaches,
    conditionals: [...html.matchAll(/ax-if="([^"]+)"/g)].map(m => m[1]),
    events: [...html.matchAll(/ax-on:(\w+)="([^"]+)"/g)].map(m => ({
      event: m[1],
      handler: m[2],
    })),
    loops: [...html.matchAll(/ax-for="([^"]+)"/g)].map(m => {
      const [alias = "", source = ""] = m[1].split(/\s+in\s+/).map(s => s.trim());
      return { alias, source };
    }),
    models: [...html.matchAll(/ax-model="([^"]+)"/g)].map(m => m[1]),
    elses: [...html.matchAll(AX_ELSE)].filter(m => insideTag(html, m.index!)).length,
  };
}
