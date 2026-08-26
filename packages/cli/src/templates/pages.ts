// Example file-system SPA routes scaffolded by `advanx create`.
// Each page is a Trinity (logic.ts + view.html + style.css); the router wires
// them from src/pages/<name>/ into routes ("index" → "/").

export const PAGE_INDEX_LOGIC = `import { signal } from "../../lib/advanx/runtime.ts";

export const siteName = signal("AdvanxJS");
export const clicks = signal(0);

export function bump() {
  clicks.value++;
}
`;

export const PAGE_INDEX_VIEW = `<section class="page">
  <h1>Welcome to {{ siteName }}</h1>
  <p>Clicks so far: {{ clicks }}</p>
  <button ax-on:click="bump">Click me</button>
  <nav>
    <a ax-link="/about">Go to About →</a>
  </nav>
</section>
`;

export const PAGE_INDEX_STYLE = `.page { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 2rem; }
.page h1 { color: #5b21b6; }
.page nav a { color: #2563eb; text-decoration: none; }
.page nav a:hover { text-decoration: underline; }
.page button { padding: 0.5rem 1rem; cursor: pointer; }
`;

export const PAGE_ABOUT_LOGIC = `import { signal } from "../../lib/advanx/runtime.ts";

export const siteName = signal("AdvanxJS");
export const blurb = signal("A file-system-based, agent-native SPA.");
`;

export const PAGE_ABOUT_VIEW = `<section class="page">
  <h1>About {{ siteName }}</h1>
  <p>{{ blurb }}</p>
  <nav>
    <a ax-link="/">← Back home</a>
  </nav>
</section>
`;

export const PAGE_ABOUT_STYLE = `.page { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 2rem; }
.page h1 { color: #5b21b6; }
.page nav a { color: #2563eb; text-decoration: none; }
.page nav a:hover { text-decoration: underline; }
`;
