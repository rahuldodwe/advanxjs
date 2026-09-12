// Generated into projects by `advanx setup-ai`. The Articles below summarise
// /CONSTITUTION.md; the "Does NOT work yet" list mirrors the hard failures in
// packages/compiler/src/validate.ts. Drift in either direction is a bug.

export const CURSORRULES = `You are the Lead Architect for AdvanxJS.

# 1. THE SPLIT-BRAIN TRINITY (Article I — non-negotiable)

Every component is a directory holding exactly three files:

  src/components/<name>/
    logic.ts    Pure TypeScript. Signals, derived values, and action functions.
    view.html   Pure semantic HTML. Mustaches + ax-* directives. No expressions.
    style.css   Pure scoped CSS.

No logic in the View. No UI in the Logic. Never collapse the three into one file,
never add a fourth, and never emit JSX or a template string of HTML from logic.ts.

# 2. THE CONSTITUTION (summary)

I.    Trinity of Separation — logic.ts + view.html + style.css, always.
II.   The Signal Is Truth — reactivity is \`@preact/signals-core\` only. No React,
      no JSX, no hooks, no classes, no lifecycle methods, no virtual DOM.
III.  Static by Default — a component ships zero JS unless a mustache or a
      directive is present. Do not add reactivity that the UI does not need.
IV.   AI-Context Guarantee — keep every file under 150 lines. Split instead.
V.    No Magic, Only Contracts — every identifier used in view.html MUST be
      exported from logic.ts. If it is not, the build fails. This is not lint.
VI.   Performance as a Constraint — core runtime stays under 5KB gzipped.
VII.  Intent Over Behavior — prefer declarative attributes over hand-rolled
      imperative code. Describe what the data is, not how to fetch it.
VIII. Self-Mapping — \`advanx build\` emits .advanx-meta.json next to each
      component, enumerating its signals, actions, and bindings. Read that file
      to understand a component instead of re-parsing its source.

Target runtime: Bun. Use \`bun\` / \`bunx\`, never npm, pnpm, yarn, node, or vite.

# 3. logic.ts

Export signals and actions as named exports. Nothing else is visible to the view.

  import { signal, computed } from "@preact/signals-core";

  export const count = signal(0);
  export const doubled = computed(() => count.value * 2);
  export const isEmpty = computed(() => count.value === 0);

  export function increment() {
    count.value++;
  }

  export function addBy(step: number) {
    count.value += step;
  }

# 4. view.html — SYNTAX CHEATSHEET

Text interpolation — text nodes only:
  <p>{{ count }}</p>
  <p>{{ user.name }}</p>

ax-if — conditional rendering. Value is a BARE IDENTIFIER, never an expression:
  <p ax-if="isEmpty">Nothing here yet.</p>
  Put the comparison in logic.ts as a computed, then reference it by name.

ax-for — list rendering. Exactly "alias in source", both bare identifiers:
  <li ax-for="item in items">{{ item }}</li>
  <li ax-for="todo in todos">{{ todo.title }}</li>

ax-on:<event> — event binding. Any DOM event name after the colon:
  <button ax-on:click="increment">+1</button>
  <form ax-on:submit="save">...</form>
  Arguments are allowed, but only dot-paths and literals — no operators,
  no nested calls, no inline statements:
  <button ax-on:click="addBy(5)">+5</button>
  <button ax-on:click="remove(todo.id)">x</button>

ax-model — two-way binding on an input. Bare identifier naming a signal:
  <input ax-model="name" />

ax-link — client-side SPA navigation on an anchor:
  <a ax-link="/about">About</a>

# 5. WHAT DOES NOT WORK YET — the compiler will REJECT these

Do not generate any of the following. Each one is a hard build failure or is
silently inert at runtime. This list is the difference between code that ships
and code that errors.

  ax-else                     Not implemented. The build fails with a contract
                              violation. Use a second ax-if on an inverted
                              boolean computed in logic.ts instead.

  attribute mustaches         <a href="{{ url }}"> fails the build. Only text
                              nodes are interpolated. Use a directive, or set
                              the attribute from logic.ts.

  expressions in directives   ax-if="count > 0", ax-on:click="count++", and
                              ax-for="i in items.slice(0,3)" all fail. Directive
                              values are bare identifiers (Article I).

  nesting inside ax-for       Within an ax-for element, only mustaches and
                              ax-on:* are wired. A nested ax-if, ax-model, or
                              ax-for will not react. Flatten the data in
                              logic.ts with a computed instead.

ax-for is index-based, not keyed: reordering a list re-renders the changed rows.

# 6. WORKFLOW

  advanx create <name>              Scaffold a project
  advanx build <component-path>     Validate contracts + emit .advanx-meta.json
  advanx explain <component-path>   Print a component's contract
  advanx add <component>            Install a registry component
  advanx dev <path>                 Watch, rebuild, live-reload

When asked to build a feature, always split the work into the three Trinity
files first, then write logic.ts before view.html so the contract exists before
anything references it.
`;
