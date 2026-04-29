export const HELP = `AdvanxJS — Agent-Native CLI

Usage:
  advanx build <component-path>      Compile a component (logic.ts + view.html + style.css)
  advanx create <project-name>       Scaffold a new AdvanxJS project
  advanx explain <component-path>    Print the component's contract from .advanx-meta.json
  advanx --help                      Show this help

Examples:
  advanx build tests/counter
  advanx create my-app
  advanx explain tests/counter
`;

export function printHelp(): void {
  process.stdout.write(HELP);
}
