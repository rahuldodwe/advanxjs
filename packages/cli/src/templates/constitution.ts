// Verbatim copy of /CONSTITUTION.md — these are the immutable laws of AdvanxJS.
// Any drift between this string and the root CONSTITUTION.md is a bug.

export const CONSTITUTION = `# 📜 THE ADVANXJS CONSTITUTION

This document defines the non-negotiable laws of AdvanxJS. Any code that violates these laws is NOT AdvanxJS.

### ARTICLE I: THE TRINITY OF SEPARATION (The Split-Brain)
Every component MUST consist of exactly three files:
1. \`logic.ts\`: Pure TypeScript/Signals logic.
2. \`view.html\`: Pure semantic HTML with {{ mustache }} bindings.
3. \`style.css\`: Pure scoped CSS.
*No logic in the View; No UI in the Logic.*

### ARTICLE II: THE SIGNAL IS TRUTH
Reactivity is handled exclusively via Signals. There shall be no "Hooks," "Classes," or "Life-cycle methods." If data changes, the Signal updates the DOM directly.

### ARTICLE III: STATIC BY DEFAULT
The framework assumes a component is 100% Static HTML unless a binding (\`{{ }}\`) or a directive (\`ax-if\`, \`ax-for\`) is detected. We ship the minimum JavaScript required.

### ARTICLE IV: AI-CONTEXT GUARANTEE
Every file must be small and modular. If a file exceeds 150 lines, it is a candidate for splitting. This ensures AI Agents never lose context.

### ARTICLE V: NO MAGIC, ONLY CONTRACTS
The compiler must validate that every variable used in \`view.html\` is explicitly exported in \`logic.ts\`. If the contract is broken, the build MUST fail with a clear explanation.

### ARTICLE VI: PERFORMANCE AS A CONSTRAINT
The core runtime must remain under 5KB (gzipped). Features that exceed this budget must be moved to the compiler layer or discarded.

### ARTICLE VII: INTENT OVER BEHAVIOR
Prioritize declarative attributes (e.g., \`ax-api\`, \`ax-cache\`) over manual JavaScript execution. Describe *what* the data is, not *how* to fetch it.

### ARTICLE VIII: SELF-MAPPING (Agent Discoverability)
Every compiled component MUST emit a \`.advanx-meta.json\` sibling file enumerating its signals, actions, and view bindings (mustaches, conditionals, and event handlers). This artifact is the Agent's contract for reasoning about the component without parsing source. If the metadata cannot be produced, the build MUST fail.

---
**Founder:** Rahul Dodwe
**Status:** ACTIVE
`;
