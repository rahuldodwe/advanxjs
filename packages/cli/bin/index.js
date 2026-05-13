#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, sep } from "node:path";
import {
  copyFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
  readFileSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const installedCore = join(here, "core.js");
const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));
const version = pkg.version;

const isRestricted = installedCore
  .split(sep)
  .some((seg) => seg.startsWith("."));

function probeBunRead(dir) {
  const probe = join(dir, `advanx-probe-${process.pid}.js`);
  try {
    writeFileSync(probe, "process.exit(0)");
    const r = spawnSync("bun", [probe], { timeout: 3000 });
    return r.status === 0;
  } catch {
    return false;
  } finally {
    try { unlinkSync(probe); } catch {}
  }
}

function findUsableDir(candidates) {
  for (const dir of candidates) {
    try {
      mkdirSync(dir, { recursive: true });
      if (probeBunRead(dir)) return dir;
    } catch {}
  }
  return null;
}

function resolveCorePath() {
  if (!isRestricted) return installedCore;

  const dir = findUsableDir([
    "/tmp/advanx-runtime",
    join(homedir(), "advanx-runtime"),
  ]);
  if (!dir) return installedCore;

  try {
    for (const f of readdirSync(dir)) {
      if (f.startsWith("core-") && f.endsWith(".js") && f !== `core-${version}.js`) {
        try { unlinkSync(join(dir, f)); } catch {}
      }
    }
  } catch {}

  const dest = join(dir, `core-${version}.js`);
  if (!existsSync(dest)) {
    copyFileSync(installedCore, dest);
    try { chmodSync(dest, 0o644); } catch {}
  }
  return dest;
}

const corePath = resolveCorePath();

const child = spawn("bun", [corePath, ...process.argv.slice(2)], {
  stdio: "inherit",
});

child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error("advanxjs requires Bun. Install: https://bun.sh");
    process.exit(1);
  }
  throw err;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
