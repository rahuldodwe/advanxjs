import fs from "fs";
import path from "path";
import { parseView } from "./parseView";

// ── Article III, fully realized ────────────────────────────────────────────
// SSR by running the REAL runtime against a build-time DOM (happy-dom). We
// import the page's logic.ts, mount the view exactly as the browser would, and
// serialize the result. Zero server/client divergence — it's the same mount().
// happy-dom is build-time only and never enters the shipped bundle.

let domReady = false;

async function registerDom(): Promise<void> {
  if (domReady) return;
  const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
  if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();
  domReady = true;
}

/** A view with no bindings/directives ships zero JS (Article III). */
export function isStaticView(view: string): boolean {
  const b = parseView(view);
  return (
    b.mustaches.length === 0 &&
    b.conditionals.length === 0 &&
    b.events.length === 0 &&
    b.loops.length === 0 &&
    b.models.length === 0
  );
}

/** Render a view to a fully-resolved HTML string using the real runtime. */
export async function renderToString(view: string, logicPath: string): Promise<string> {
  await registerDom();
  // Imported after the DOM exists: directives.ts touches document/NodeFilter.
  const { mount } = await import("../../core/src/runtime.ts");
  const logic = await import(logicPath);
  const container = document.createElement("div");
  container.innerHTML = view;
  mount(container as unknown as HTMLElement, logic);
  return container.innerHTML;
}

type PageOpts = {
  title: string;
  hostId: string;
  style: string;
  content: string;
  /** null → ship no JavaScript at all. */
  scriptSrc: string | null;
};

function pageHtml(o: PageOpts): string {
  const styleTag = o.style.trim() ? `\n<style>${o.style}</style>` : "";
  const scriptTag = o.scriptSrc ? `<script src="${o.scriptSrc}"></script>` : "";
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>${o.title}</title>${styleTag}</head>
<body><div id="${o.hostId}">${o.content}</div>${scriptTag}</body>
</html>
`;
}

/** Pre-render a single component into <outDir>/index.html. */
export async function prerenderComponent(dir: string, outDir: string): Promise<void> {
  const view = fs.readFileSync(path.join(dir, "view.html"), "utf-8");
  const style = fs.readFileSync(path.join(dir, "style.css"), "utf-8");
  const isStatic = isStaticView(view);

  // Static views have nothing to resolve; the template IS the final HTML.
  const content = isStatic ? view : await renderToString(view, path.join(dir, "logic.ts"));

  fs.mkdirSync(outDir, { recursive: true });
  const html = pageHtml({
    title: path.basename(dir),
    hostId: "app",
    style,
    content,
    scriptSrc: isStatic ? null : "./bundle.js",
  });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
}

/**
 * Pre-render every SPA route into its own crawlable file:
 *   /        → <outDir>/index.html
 *   /about   → <outDir>/about/index.html
 * Each links the shared root-absolute /bundle.js for client-side hydration
 * and navigation.
 */
export async function prerenderPages(rootDir: string, outDir: string): Promise<number> {
  const pagesDir = path.join(rootDir, "src", "pages");
  const names = fs
    .readdirSync(pagesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  let count = 0;
  for (const name of names) {
    const pageDir = path.join(pagesDir, name);
    const view = fs.readFileSync(path.join(pageDir, "view.html"), "utf-8");
    const style = fs.readFileSync(path.join(pageDir, "style.css"), "utf-8");
    const route = name === "index" ? "/" : "/" + name;

    const content = isStaticView(view)
      ? view
      : await renderToString(view, path.join(pageDir, "logic.ts"));

    const html = pageHtml({
      title: "AdvanxJS App",
      hostId: "router-view",
      style,
      content,
      // Always ship the bundle in SPA mode — the router drives navigation.
      scriptSrc: "/bundle.js",
    });

    const outFile = route === "/" ? path.join(outDir, "index.html") : path.join(outDir, name, "index.html");
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html);
    count++;
  }
  return count;
}
