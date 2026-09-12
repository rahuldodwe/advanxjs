import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { listComponentDirs } from "./components.ts";

/**
 * Build the Advanx MCP server with its tools registered, but no transport
 * attached. The caller owns the transport — `src/index.ts` connects stdio for
 * `bun run start`, and the CLI's `advanx mcp` command does the same for the
 * published binary.
 */
export function createAdvanxMcpServer(): McpServer {
  const server = new McpServer({
    name: "advanx",
    version: "0.1.0",
    description: "Read-only bridge between AdvanxJS components and Claude",
  });

  server.tool(
    "list_advanx_components",
    "Scan a components directory and return all AdvanxJS component names.",
    {
      components_dir: z
        .string()
        .optional()
        .describe("Path to components directory (defaults to ./src/components)"),
    },
    async ({ components_dir }) => {
      const dir = resolve(components_dir ?? "src/components");
      try {
        const components = await listComponentDirs(dir);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ components_dir: dir, components }, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Could not read components directory "${dir}". Run "advanx create <name>" first, or pass a valid components_dir.\n${String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_component_map",
    "Read the .advanx-meta.json of a specific component and return its full map (signals, actions, bindings).",
    {
      component: z
        .string()
        .describe("Component name (subdirectory name under components_dir)"),
      components_dir: z
        .string()
        .optional()
        .describe("Path to components directory (defaults to ./src/components)"),
    },
    async ({ component, components_dir }) => {
      const dir = resolve(components_dir ?? "src/components");
      const metaPath = join(dir, component, ".advanx-meta.json");
      try {
        const raw = await readFile(metaPath, "utf-8");
        return {
          content: [{ type: "text", text: raw }],
        };
      } catch {
        return {
          content: [
            {
              type: "text",
              text: `Error: No meta file found at "${metaPath}". Run "advanx build ${join(dir, component)}" first to generate it.`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

/**
 * Connect the server to stdio. Every @modelcontextprotocol/sdk import lives in
 * this package, so callers (src/index.ts, and the CLI's `advanx mcp`) need no
 * SDK dependency of their own.
 */
export async function startStdioServer(): Promise<void> {
  await createAdvanxMcpServer().connect(new StdioServerTransport());
}
