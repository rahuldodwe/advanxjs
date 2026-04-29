#!/usr/bin/env bun
import { printHelp } from "./help.ts";

const [, , cmd, ...rest] = process.argv;

switch (cmd) {
  case "build": {
    const { run } = await import("./commands/build.ts");
    await run(rest);
    break;
  }
  case "create": {
    const { run } = await import("./commands/create.ts");
    await run(rest);
    break;
  }
  case "explain": {
    const { run } = await import("./commands/explain.ts");
    await run(rest);
    break;
  }
  case "--help":
  case "-h":
  case undefined:
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${cmd}\n`);
    printHelp();
    process.exit(1);
}
