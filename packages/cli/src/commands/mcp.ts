// `advanx mcp` speaks MCP over stdio. stdout is the JSON-RPC channel — this
// command must never print to it. Diagnostics go to stderr or nowhere.
export async function run(): Promise<void> {
  const { startStdioServer } = await import("../../../mcp/src/server.ts");
  await startStdioServer();
}
