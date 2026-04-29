import fs from "fs";
import path from "path";

interface Meta {
  component: string;
  signals: string[];
  computed: string[];
  actions: string[];
  structure: {
    mustaches: string[];
    conditionals: string[];
    events: { event: string; handler: string }[];
    loops: { alias: string; source: string }[];
    models: string[];
  };
  tokens_hint?: string;
}

export async function run(args: string[]): Promise<void> {
  const target = args[0];
  if (!target) {
    console.error("Usage: advanx explain <component-folder>");
    process.exit(1);
  }

  const dir = path.resolve(target);
  const metaPath = path.join(dir, ".advanx-meta.json");
  if (!fs.existsSync(metaPath)) {
    console.error(`🚨 No .advanx-meta.json found at ${dir}`);
    console.error(`   Build first: advanx build ${target}`);
    process.exit(1);
  }

  const meta: Meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  const lines = render(meta, target);
  console.log(lines.join("\n"));
}

function render(m: Meta, displayPath: string): string[] {
  const out: string[] = [];
  const heading = `AdvanxJS Component: ${m.component}`;
  out.push(heading);
  out.push("─".repeat(heading.length));
  out.push(`Path: ${displayPath}`);
  out.push("");
  out.push(`STATE (Signals):     ${list(m.signals)}`);
  out.push(`DERIVED (Computed):  ${list(m.computed)}`);
  out.push(`ACTIONS:             ${list(m.actions)}`);
  out.push("");
  out.push("VIEW STRUCTURE:");
  out.push(`  Mustaches:    ${list(m.structure.mustaches)}`);
  out.push(`  Conditionals: ${list(m.structure.conditionals)}`);
  out.push(`  Events:       ${list(m.structure.events.map(e => `${e.event} → ${e.handler}`))}`);
  out.push(`  Loops:        ${list(m.structure.loops.map(l => `${l.alias} in ${l.source}`))}`);
  out.push(`  Models:       ${list(m.structure.models)}`);
  out.push("");
  out.push("REACTIVITY FLOW:");
  const flows = describeFlow(m);
  if (flows.length === 0) out.push("  (static — no reactive bindings)");
  else for (const f of flows) out.push(`  • ${f}`);
  if (m.tokens_hint) {
    out.push("");
    out.push(`AGENT NOTES: ${m.tokens_hint}`);
  }
  return out;
}

function describeFlow(m: Meta): string[] {
  const flows: string[] = [];
  const reactive = new Set([...m.signals, ...m.computed]);
  const writableMustaches = m.structure.mustaches
    .map(x => x.split(".")[0]!)
    .filter(root => reactive.has(root));

  for (const e of m.structure.events) {
    const targets = writableMustaches.length
      ? `mustaches [${[...new Set(writableMustaches)].join(", ")}]`
      : "the DOM";
    flows.push(`${e.handler}() runs on ${e.event} → re-renders ${targets}`);
  }
  for (const name of m.structure.models) {
    flows.push(`ax-model="${name}" — input edits write to signal \`${name}\` (two-way)`);
  }
  for (const l of m.structure.loops) {
    flows.push(`ax-for="${l.alias} in ${l.source}" — list re-renders when \`${l.source}\` changes`);
  }
  for (const c of m.structure.conditionals) {
    flows.push(`ax-if="${c}" — block toggles when \`${c}\` changes`);
  }
  return flows;
}

function list(items: string[]): string {
  return items.length === 0 ? "(none)" : items.join(", ");
}
