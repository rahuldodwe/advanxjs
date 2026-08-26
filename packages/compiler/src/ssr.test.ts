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
