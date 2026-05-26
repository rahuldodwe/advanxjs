import path from "path";
import fs from "fs";

export function createStaticHandler(
  target: string,
  transformHtml?: (html: string) => string,
) {
  const fallback = path.join(target, "index.html");

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const filePath = path.join(target, pathname);
    if (!filePath.startsWith(target + path.sep) && filePath !== target) {
      return new Response("Forbidden", { status: 403 });
    }

    const file = Bun.file(filePath);
    if (await file.exists()) {
      if (transformHtml && filePath.endsWith(".html")) {
        return new Response(transformHtml(await file.text()), {
          headers: { "Content-Type": "text/html" },
        });
      }
      return new Response(file);
    }

    const fb = Bun.file(fallback);
    if (await fb.exists()) {
      return transformHtml
        ? new Response(transformHtml(await fb.text()), {
            headers: { "Content-Type": "text/html" },
          })
        : new Response(fb);
    }
    return new Response("Not found", { status: 404 });
  };
}

export async function run(args: string[]): Promise<void> {
  const target = path.resolve(args[0] ?? "dist");
  if (!fs.existsSync(target)) {
    console.error(`Directory not found: ${target}`);
    process.exit(1);
  }
  const port = Number(process.env.PORT ?? 3000);

  Bun.serve({ port, fetch: createStaticHandler(target) });

  console.log(`✔ AdvanxJS dev server: http://localhost:${port} (serving ${target})`);
}
