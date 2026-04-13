# 📜 AdvanxJS: The Agent-Native Framework

**Stop fighting AI hallucinations. Start building with Agent Experience (AX).**

AdvanxJS is a next-generation frontend framework designed to be perfectly readable, writable, and maintainable by AI Agents (Claude, Gemini, GPT-4). While traditional frameworks like React and Next.js are built for humans (DX), AdvanxJS is built for the **AI + Human** partnership.

---

### 🧠 Why AdvanxJS?

Modern frontend code is a mess of mixed logic and UI (JSX), which causes AI agents to hallucinate, mismanage hooks, and create "glue-code" bugs. AdvanxJS solves this with a strict **Split-Brain Architecture.**

- **🚀 Performance:** No Virtual DOM. Surgical O(1) DOM updates via Signals.
- **🤖 AI-Native (AX):** Logic, View, and Style are strictly separated so AI never loses context.
- **⚡ Bun-Native:** Built to leverage the speed of the Bun runtime and bundler.
- **🔍 SEO-First:** Pure HTML/CSS output. No hydration "jank." 100/100 Lighthouse scores by default.

---

### ⚖️ The Advanx Constitution

AdvanxJS is governed by 7 Immutable Articles:
1. **The Trinity of Separation:** Component = `logic.ts` + `view.html` + `style.css`.
2. **The Signal is Truth:** Reactivity is handled exclusively via Signals.
3. **Static by Default:** Minimal JS. Ship only what is interactive.
4. **AI-Context Guarantee:** Modular files designed to fit within AI context windows.
5. **No Magic, Only Contracts:** Build-time validation of logic-to-view bindings.
6. **Performance as a Constraint:** Tiny runtime (<5KB gzipped).
7. **Intent Over Behavior:** Declarative HTML attributes over imperative JS.

---

### 🛠️ Quick Start (MVP v0.1)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/advanxjs.git
cd advanxjs

# Install dependencies
bun install

# Build the sample counter
bun packages/cli/src/index.ts tests/counter
```
