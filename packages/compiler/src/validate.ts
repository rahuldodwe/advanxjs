export function validateBindings(html: string, logicExports: string[]) {
  const mustacheBindings = [...html.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]);
  const ifBindings = [...html.matchAll(/ax-if="(\w+)"/g)].map(m => m[1]);

  const allNeeded = [...new Set([...mustacheBindings, ...ifBindings])];
  const missing = allNeeded.filter(name => !logicExports.includes(name));

  if (missing.length > 0) {
    throw new Error(`🚨 ADVANXJS CONTRACT VIOLATION: Missing exports for [${missing.join(", ")}]`);
  }

  return { mustacheBindings, ifBindings };
}
