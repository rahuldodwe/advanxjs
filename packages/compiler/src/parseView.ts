export interface ViewBindings {
  /** Text-node mustaches only — the ones the runtime actually interpolates. */
  mustaches: string[];
  /** Mustaches sitting in attribute position. The runtime never resolves these. */
  attributeMustaches: { attribute: string; expression: string }[];
  conditionals: string[];
  events: { event: string; handler: string }[];
  loops: { alias: string; source: string }[];
  models: string[];
  /** `ax-bind:<attr>` / `:<attr>` bindings, prefix already stripped. */
  boundAttributes: { attribute: string; source: string }[];
  /** Each `ax-else`, with the structural facts validate.ts needs to judge it. */
  elses: { followsIf: boolean; valued: boolean }[];
}

const MUSTACHE = /\{\{\s*([\w.]+)\s*\}\}/g;
const ATTR_BEFORE = /([\w:.\-]+)\s*=\s*["'][^"']*$/;
// A leading `(?:^|\s)` is what keeps `ax-on:click="…"` out of the `:attr` branch.
const BOUND_ATTR = /(?:^|\s)(?::|ax-bind:)([\w.-]+)\s*=\s*"([^"]*)"/g;
const TAG = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)(\/?)>/g;
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "source", "track", "wbr",
]);

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

/**
 * Walk the tag stream tracking each element's immediate previous ELEMENT sibling,
 * which is the only structural fact `ax-else` validation needs. A stack frame per
 * open element remembers the attributes of the last child closed at that depth.
 */
function scanElses(html: string): { followsIf: boolean; valued: boolean }[] {
  const out: { followsIf: boolean; valued: boolean }[] = [];
  const stack: { prev: string | null }[] = [{ prev: null }];
  for (const m of html.matchAll(TAG)) {
    const [, closing, tag, attrs = "", selfClose] = m;
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const frame = stack[stack.length - 1]!;
    const elseMatch = attrs.match(/(?:^|\s)ax-else(\s*=\s*"([^"]*)")?/);
    if (elseMatch) {
      out.push({
        followsIf: /(?:^|\s)ax-if\s*=/.test(frame.prev ?? ""),
        valued: elseMatch[1] !== undefined,
      });
    }
    frame.prev = attrs;
    if (!selfClose && !VOID.has(tag!.toLowerCase())) stack.push({ prev: null });
  }
  return out;
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
    boundAttributes: [...html.matchAll(BOUND_ATTR)]
      .filter(m => insideTag(html, m.index!))
      .map(m => ({ attribute: m[1]!, source: m[2]! })),
    elses: scanElses(html),
  };
}

/**
 * Article III — a view with no bindings and no directives ships zero JS. Every
 * reactive construct must be listed here: missing one would silently strip the
 * runtime from a page that needs it.
 */
export function hasBindings(b: ViewBindings): boolean {
  return (
    b.mustaches.length > 0 ||
    b.conditionals.length > 0 ||
    b.events.length > 0 ||
    b.loops.length > 0 ||
    b.models.length > 0 ||
    b.boundAttributes.length > 0
  );
}
