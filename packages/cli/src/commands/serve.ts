import path from "path";
import fs from "fs";

export async function run(args: string[]): Promise<void> {
  const target = path.resolve(args[0] ?? "dist");
  if (!fs.existsSync(target)) {
    console.error(`Directory not found: ${target}`);
    process.exit(1);
  }
  const port = Number(process.env.PORT ?? 3000);
  const fallback = path.join(target, "index.html");
  const hasFallback = fs.existsSync(fallback);

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";

      const filePath = path.join(target, pathname);
      if (!filePath.startsWith(target + path.sep) && filePath !== target) {
        return new Response("Forbidden", { status: 403 });
      }

      const file = Bun.file(filePath);
      if (await file.exists()) return new Response(file);

      if (hasFallback) return new Response(Bun.file(fallback));
      return new Response("Not found", { status: 404 });
    },
  });

  console.log(`✔ AdvanxJS dev server: http://localhost:${port} (serving ${target})`);
}
