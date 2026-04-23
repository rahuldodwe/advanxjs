export interface ViewBindings {
  mustaches: string[];
  conditionals: string[];
  events: { event: string; handler: string }[];
}

export function parseView(html: string): ViewBindings {
  return {
    mustaches: [...html.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]),
    conditionals: [...html.matchAll(/ax-if="([^"]+)"/g)].map(m => m[1]),
    events: [...html.matchAll(/ax-on:(\w+)="(\w+)"/g)].map(m => ({
      event: m[1],
      handler: m[2],
    })),
  };
}
