export interface ViewBindings {
  mustaches: string[];
  conditionals: string[];
  events: { event: string; handler: string }[];
  loops: { alias: string; source: string }[];
  models: string[];
}

export function parseView(html: string): ViewBindings {
  return {
    mustaches: [...html.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m => m[1]),
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
  };
}
