export const HELP = `AdvanxJS — Agent-Native CLI

Usage:
  advanx build <path>                Compile a component, or — if <path>/src/pages exists —
                                     compile every subfolder as an SPA route and emit routes.js
  advanx export <path> [--out <dir>] Pre-render to static HTML (Instant-SEO). Runs the real
                                     runtime at build time so the .html ships with content
                                     already inside; JS still loads after for interactivity.
  advanx serve <dir>                 Run a dev server with SPA history fallback
                                     (defaults to ./dist; PORT env var overrides 3000)
  advanx dev <path>                  Watch + recompile on save and serve with live
                                     browser reload (PORT env var overrides 3000)
  advanx create <project-name>       Scaffold a new AdvanxJS project
  advanx explain <component-path>    Print the component's contract from .advanx-meta.json
  advanx add <component>             Add a component from the registry
  advanx add --list                  List available registry components
  advanx --help                      Show this help

Examples:
  advanx build tests/counter         (single-component mode)
  advanx build tests/spa-demo        (SPA / pages mode — auto-detects src/pages)
  advanx export tests/counter        (pre-render a component to static HTML)
  advanx export tests/spa-demo       (pre-render every SPA route to its own .html)
  advanx serve tests/spa-demo/dist   (serve the SPA build with deep-link refresh support)
  advanx dev tests/counter           (save-to-refresh dev loop with live reload)
  advanx create my-app
  advanx explain tests/counter
  advanx add navbar                  (add navbar component to src/components/)
  advanx add --list                  (show available components)
`;

export function printHelp(): void {
  process.stdout.write(HELP);
}
