import fs from "fs";
import path from "path";
import { listComponents } from "../../../registry/src/index.ts";

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

  // Add component suggestions
  const viewPath = path.join(dir, "view.html");
  if (fs.existsSync(viewPath)) {
    const viewContent = fs.readFileSync(viewPath, "utf-8");
    const suggestions = suggestComponents(viewContent, meta);
    if (suggestions.length > 0) {
      lines.push("");
      lines.push("RELATED COMPONENTS:");
      for (const suggestion of suggestions) {
        lines.push(`  ${suggestion}`);
      }
    }
  }

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

interface ComponentSuggestion {
  component: string;
  reason: string;
}

function suggestComponents(viewContent: string, meta: Meta): string[] {
  const suggestions: ComponentSuggestion[] = [];
  const availableComponents = listComponents();
  const availableNames = new Set(availableComponents.map(c => c.name));

  // Check for missing navigation
  const hasNav = /<nav[\s>]/i.test(viewContent) || /navbar/i.test(viewContent);
  const hasAxLink = /ax-link/i.test(viewContent);

  if (!hasNav && hasAxLink && availableNames.has("navbar")) {
    suggestions.push({
      component: "navbar",
      reason: "This page uses ax-link but has no navigation component.",
    });
  }

  // Check for missing footer (future component)
  const hasFooter = /<footer[\s>]/i.test(viewContent);
  if (!hasFooter && availableNames.has("footer")) {
    suggestions.push({
      component: "footer",
      reason: "This page has no footer element.",
    });
  }

  // Format suggestions
  return suggestions.map(s => {
    return `💡 ${s.reason}\n     Run: advanx add ${s.component}`;
  });
}
