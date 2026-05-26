import fs from "fs";
import path from "path";
import { compileComponent, compilePages } from "../../../compiler/src/index.ts";
import { createStaticHandler } from "./serve.ts";

const RELOAD_PATH = "/__advanx_reload";
const RELOAD_SNIPPET = `<script>new EventSource("${RELOAD_PATH}").onmessage=()=>location.reload();</script>`;

export async function run(args: string[]): Promise<void> {
  if (!args[0]) {
    console.error("Usage: advanx dev <path>");
    process.exit(1);
  }

  const target = path.resolve(args[0]);
  const distDir = path.join(target, "dist");
  const isPages = fs.existsSync(path.join(target, "src", "pages"));
  const port = Number(process.env.PORT ?? 3000);

  const enc = new TextEncoder();
  const clients = new Set<ReadableStreamDefaultController>();
  const broadcast = () => {
    for (const c of clients) {
      try {
        c.enqueue(enc.encode("data: reload\n\n"));
      } catch {}
    }
  };

  let building = false;
  let pending = false;
  async function rebuild(): Promise<void> {
    if (building) {
      pending = true;
      return;
    }
    building = true;
    const t0 = performance.now();
    try {
      if (isPages) await compilePages(target);
      else await compileComponent(target);
      console.log(`✔ rebuilt in ${(performance.now() - t0).toFixed(1)}ms`);
      broadcast();
    } catch (err: any) {
      console.error(`✖ ${err.message}`);
    } finally {
      building = false;
      if (pending) {
        pending = false;
        rebuild();
      }
    }
  }

  await rebuild();

  const injectReload = (html: string) =>
    html.includes("</body>")
      ? html.replace("</body>", RELOAD_SNIPPET + "</body>")
      : html + RELOAD_SNIPPET;
  const serveStatic = createStaticHandler(distDir, injectReload);

  Bun.serve({
    port,
    fetch(req) {
      if (decodeURIComponent(new URL(req.url).pathname) === RELOAD_PATH) {
        let ctrl: ReadableStreamDefaultController;
        const stream = new ReadableStream({
          start(c) {
            ctrl = c;
            clients.add(c);
          },
          cancel() {
            clients.delete(ctrl);
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
      return serveStatic(req);
    },
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  fs.watch(target, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const top = filename.split(path.sep)[0];
    if (top === "dist" || top === "node_modules") return;
    if (![".ts", ".html", ".css"].includes(path.extname(filename))) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(rebuild, 30);
  });

  console.log(`✔ AdvanxJS dev server: http://localhost:${port} (serving ${distDir})`);
  console.log("🚀 Advanx Dev Mode: Watching for changes...");
}
