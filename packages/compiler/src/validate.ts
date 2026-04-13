export function validateBindings(html: string, logicExports: string[]) {
  // 1. Find {{ mustache }}
  const mustacheMatch = [...html.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]);
  
  // 2. Find ax-if="..."
  const axIfMatch = [...html.matchAll(/ax-if="(\w+)"/g)].map(m => m[1]);

  const allBindings = [...new Set([...mustacheMatch, ...axIfMatch])];
  const missing = allBindings.filter(name => !logicExports.includes(name));

  if (missing.length > 0) {
    throw new Error(`
🚨 ADVANXJS CONTRACT VIOLATION
Missing from logic.ts: ${missing.join(", ")}
`.trim());
  }
}
