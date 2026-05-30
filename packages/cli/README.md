# AdvanxJS: The Agent-Native Framework

**Stop fighting AI hallucinations. Start building with Agent Experience (AX).**

AdvanxJS is a next-generation frontend framework designed to be perfectly readable, writable, and maintainable by AI Agents (Claude, Gemini, GPT-4). While traditional frameworks like React and Next.js are built for humans (DX), AdvanxJS is built for the **AI + Human** partnership.

---

## Quick Start

Scaffold a new AdvanxJS project in one command — no clone, no install required:

```bash
npx advanxjs@latest create my-app
cd my-app
bun install
advanxjs dev src/components/counter   # live save-to-refresh loop
```

That's it. You get a fully-structured project with a sample counter component, the runtime, the directives engine, and a `CONSTITUTION.md` that AI agents can read to understand the project rules.

---

## Why AdvanxJS?

Modern frontend code is a mess of mixed logic and UI (JSX), which causes AI agents to hallucinate, mismanage hooks, and create "glue-code" bugs. AdvanxJS solves this with a strict **Split-Brain Architecture.**

- **Performance:** No Virtual DOM. Surgical O(1) DOM updates via Signals.
- **AI-Native (AX):** Logic, View, and Style are strictly separated so AI never loses context.
- **Bun-Native:** Built to leverage the speed of the Bun runtime and bundler.
- **SEO-First:** Pure HTML/CSS output. No hydration "jank." 100/100 Lighthouse scores by default.

---

## CLI Commands

| Command | Description |
|---|---|
| `advanxjs create <name>` | Scaffold a new AdvanxJS project with the sample counter |
| `advanxjs dev <path>` | Watch + recompile on save and serve with **live browser reload** |
| `advanxjs build <component-path>` | Compile a component (`logic.ts` + `view.html` + `style.css`) |
| `advanxjs export <path> [--out <dir>]` | Pre-render to static HTML (**Instant-SEO**) — content ships inside the `.html`, JS hydrates after |
| `advanxjs serve <dir>` | Static dev server with SPA history fallback |
| `advanxjs add <component>` | Add a component from the registry (`add --list` to browse) |
| `advanxjs explain <component-path>` | Print the component's contract from `.advanx-meta.json` |
| `advanxjs --help` | Show help |

---

## Dev Mode (Save-to-Refresh)

```bash
advanxjs dev src/components/counter
```

One command starts a file watcher and a local server together. Every time you save a
`.ts`, `.html`, or `.css` file, the component recompiles (typically in single-digit
milliseconds) and the browser reloads itself automatically — no manual refresh, no config.

---

## Static Export (Instant-SEO)

```bash
advanxjs export src/components/counter      # single component → dist/
advanxjs export .                            # SPA (auto-detects src/pages) → one .html per route
advanxjs export . --out public               # custom output directory
```

`export` is a superset of `build`: it validates the contract and bundles for
hydration, then **pre-renders the page at build time** by running the real runtime
against a build-time DOM. The resulting `.html` already contains the resolved content
— `{{ mustache }}` values filled, `ax-for` loops expanded, `ax-if` conditionals
decided — so crawlers and first paint see real content with zero client JS required.
The `bundle.js` still loads afterward to make the page interactive (clicks, inputs).

- **SEO-perfect:** the markup is in the file, not generated in the browser.
- **Instant first paint:** no blank-then-hydrate flash.
- **Static by Default (Article III):** a component with zero bindings ships **no JavaScript at all**.
- **Host anywhere:** the output folder is plain static files — drop it on S3, GitHub Pages, or any CDN.

For SPA projects, each route becomes its own crawlable file (`dist/index.html`,
`dist/about/index.html`, …) sharing a single `/bundle.js` for client-side navigation.

---

## The Advanx Constitution

AdvanxJS is governed by 7 Immutable Articles:

1. **The Trinity of Separation:** Component = `logic.ts` + `view.html` + `style.css`.
2. **The Signal is Truth:** Reactivity is handled exclusively via Signals.
3. **Static by Default:** Minimal JS. Ship only what is interactive.
4. **AI-Context Guarantee:** Modular files designed to fit within AI context windows.
5. **No Magic, Only Contracts:** Build-time validation of logic-to-view bindings.
6. **Performance as a Constraint:** Tiny runtime (<5KB gzipped).
7. **Intent Over Behavior:** Declarative HTML attributes over imperative JS.

---

## Requirements

- [Bun](https://bun.sh) — the CLI uses Bun as its runtime. The launcher will print an install hint if Bun is missing.
- Node.js 18+ (for `npx` itself; the launcher shim runs on Node).

---

## Roadmap

- [x] **Phase 1: The Spark** — Core Runtime + Contract Validator
- [x] **Phase 2: The Engine** — `ax-if`, `ax-for` Directives & List Rendering
- [x] **Phase 3: The CLI** — Project Scaffolding & `npx advanxjs create`
- [ ] **Phase 4: AdvanxUI** — Agent-Native Premium Component Library

---

## Founder

**Rahul Dodwe**
*Building the future of Agent-Native (AX) development.*
[Follow the journey on GitHub](https://github.com/rahuldodwe)

---

## License

MIT © 2026 Rahul Dodwe
