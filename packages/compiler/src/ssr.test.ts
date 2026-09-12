import { afterAll, describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";
import {
  isStaticView,
  prerenderComponent,
  prerenderPages,
  renderToString,
} from "./ssr.ts";

const REPO = path.resolve(import.meta.dir, "../../..");
const counterDir = path.join(REPO, "tests", "counter");
const staticDir = path.join(REPO, "tests", "static");
const spaDir = path.join(REPO, "tests", "spa-demo");

// Repo-local temp output (snap-confined bun cannot use /tmp).
const outRoot = fs.mkdtempSync(path.join(import.meta.dir, "ssr-out-"));
afterAll(() => fs.rmSync(outRoot, { recursive: true, force: true }));

describe("isStaticView (Article III — Static by Default)", () => {
  test("a bound view is not static", () => {
    const view = fs.readFileSync(path.join(counterDir, "view.html"), "utf-8");
    expect(isStaticView(view)).toBe(false);
  });

  test("a view with no bindings is static", () => {
    const view = fs.readFileSync(path.join(staticDir, "view.html"), "utf-8");
    expect(isStaticView(view)).toBe(true);
  });
});

describe("renderToString (real runtime, build-time DOM)", () => {
  test("resolves mustaches against the component's logic", async () => {
    const view = fs.readFileSync(path.join(counterDir, "view.html"), "utf-8");
    const html = await renderToString(view, path.join(counterDir, "logic.ts"));
    expect(html).toContain("Count: 0");
    // Directive attributes are consumed during mount, not shipped in the HTML.
    expect(html).not.toContain("ax-on:click");
  });
});

describe("prerender writers", () => {
  test("prerenderComponent emits a crawlable index.html + hydration script", async () => {
    const out = path.join(outRoot, "counter");
    await prerenderComponent(counterDir, out);
    const html = fs.readFileSync(path.join(out, "index.html"), "utf-8");
    expect(html).toContain("Count: 0");
    expect(html).toContain("<script");
  });

  test("prerenderPages emits one crawlable file per route", async () => {
    const out = path.join(outRoot, "spa");
    const count = await prerenderPages(spaDir, out);
    expect(count).toBe(2);
    expect(fs.existsSync(path.join(out, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(out, "about", "index.html"))).toBe(true);
    const about = fs.readFileSync(path.join(out, "about", "index.html"), "utf-8");
    expect(about).toContain("About");
  });
});

// Article III at build time for the two M2 directives. SSG runs the real
// mount(), so what ships in the .html is whatever the runtime produced — the
// active branch plus a comment marking the inactive one, and attributes already
// resolved to their initial values.
describe("SSG pre-renders ax-else and attribute bindings", () => {
  const dir = fs.mkdtempSync(path.join(REPO, "tests", "ssg-m2-"));
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  // Each fixture gets its own subdirectory: the module loader caches logic.ts by
  // absolute path, so reusing one path would hand every case the first module.
  let n = 0;
  function fixture(view: string, logic: string) {
    const sub = path.join(dir, `case-${n++}`);
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, "logic.ts"), logic);
    fs.writeFileSync(path.join(sub, "view.html"), view);
    fs.writeFileSync(path.join(sub, "style.css"), "");
    return renderToString(view, path.join(sub, "logic.ts"));
  }

  const LOGIC = (flag: boolean) =>
    `import { signal, computed } from "../../../packages/core/src/runtime.ts";\n` +
    `export const flag = signal(${flag});\n` +
    `export const loading = signal(true);\n` +
    `export const hero = signal("/hero.png");\n` +
    `export const box = computed(() => ({ "--ax-x": "7px" }));\n`;

  test("renders the if branch and a comment for the else branch", async () => {
    const html = await fixture(`<p ax-if="flag">YES</p><p ax-else>NO</p>`, LOGIC(true));
    expect(html).toContain("YES");
    expect(html).not.toContain("NO");
    expect(html).toContain("<!-- ax-else -->");
  });

  test("renders the else branch when the condition starts falsy", async () => {
    const html = await fixture(`<p ax-if="flag">YES</p><p ax-else>NO</p>`, LOGIC(false));
    expect(html).toContain("NO");
    expect(html).not.toContain("YES");
    expect(html).toContain("<!-- ax-if -->");
    expect(html).not.toContain("ax-else");
  });

  test("resolves bound attributes to their initial values", async () => {
    const html = await fixture(
      `<img :src="hero" /><button :disabled="loading">go</button><div :style="box"></div>`,
      LOGIC(true),
    );
    expect(html).toContain(`src="/hero.png"`);
    expect(html).toContain("disabled");
    expect(html).toContain("--ax-x: 7px");
    // No prefixed attribute survives into the shipped HTML.
    expect(html).not.toContain(":src");
    expect(html).not.toContain(":style");
  });

  test("a view whose only binding is an attribute still ships the runtime", () => {
    expect(isStaticView(`<img :src="hero" />`)).toBe(false);
  });
});
