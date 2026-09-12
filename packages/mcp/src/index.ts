import { startStdioServer } from "./server.ts";

// Stdio bootstrap for `bun run start`. The tools and the transport live in
// server.ts so the CLI (`advanx mcp`) can reuse them without duplicating deps.
await startStdioServer();
