import { afterEach, describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";
import type { ComponentListEntry } from "./manifest.ts";
import {
  DEFAULT_REGISTRY_BASE,
  registryBase,
  registryUrl,
  resolveComponentRemote,
} from "./sources/remote.ts";

// Credibility bug 1c: the registry base was twice pointed at a repo that does not
// exist, and `fetchRegistryIndex` swallows the 404 — so nothing went red. These
// tests are the guard. The offline half anchors the URL to the repo we actually
// publish from; the network half proves it resolves.

const REPO = path.resolve(import.meta.dir, "../../..");

function publishedRepo(): { owner: string; repo: string } {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO, "package.json"), "utf-8"));
  const m = String(pkg.repository?.url ?? "").match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!m) throw new Error(`root package.json repository.url is not a GitHub URL: ${pkg.repository?.url}`);
  return { owner: m[1]!, repo: m[2]! };
}

// Restore rather than delete: the suite must stay runnable against a mirror set
// via ADVANX_REGISTRY_BASE, and the network tests below read it at call time.
const ENV = "ADVANX_REGISTRY_BASE";
const ORIGINAL_ENV = process.env[ENV];
afterEach(() => {
  if (ORIGINAL_ENV === undefined) delete process.env[ENV];
  else process.env[ENV] = ORIGINAL_ENV;
});

describe("remote registry URL", () => {
  test("targets the repo this package publishes from", () => {
    const { owner, repo } = publishedRepo();
    expect(DEFAULT_REGISTRY_BASE).toBe(
      `https://raw.githubusercontent.com/${owner}/${repo}/main/packages/registry`
    );
  });

  test("carries no trailing slash", () => {
    expect(DEFAULT_REGISTRY_BASE.endsWith("/")).toBe(false);
  });

  test("joins segments without emitting a double slash", () => {
    for (const url of [
      registryUrl("registry.json"),
      registryUrl("components", "navbar", "logic.ts"),
    ]) {
      expect(url.startsWith("https://")).toBe(true);
      expect(url.slice("https://".length)).not.toContain("//");
    }
  });

  test("ADVANX_REGISTRY_BASE overrides the default", () => {
    process.env[ENV] = "https://example.test/mirror";
    expect(registryBase()).toBe("https://example.test/mirror");
    expect(registryUrl("registry.json")).toBe("https://example.test/mirror/registry.json");
  });

  test("a trailing slash on the override is normalized away", () => {
    process.env[ENV] = "https://example.test/mirror///";
    expect(registryBase()).toBe("https://example.test/mirror");
    expect(registryUrl("registry.json")).toBe("https://example.test/mirror/registry.json");
  });
});

// Opt-in: `ADVANX_NETWORK_TESTS=1 bun test packages/registry`. CI runs this as its
// own step so a GitHub outage reddens one labelled line, not the whole suite.
const online = test.skipIf(!process.env.ADVANX_NETWORK_TESTS);

describe("remote registry reachability (network)", () => {
  online("the index is reachable, unredirected, and well-formed", async () => {
    const res = await fetch(registryUrl("registry.json"));
    expect(res.ok).toBe(true);
    expect(res.redirected).toBe(false);

    const index = (await res.json()) as { version: string; components: ComponentListEntry[] };
    expect(typeof index.version).toBe("string");
    expect(Array.isArray(index.components)).toBe(true);
    expect(index.components.length).toBeGreaterThan(0);

    for (const c of index.components) {
      expect(typeof c.name).toBe("string");
      expect(typeof c.description).toBe("string");
      expect(Array.isArray(c.tags)).toBe(true);
      expect(["free", "premium"]).toContain(c.tier);
    }
  });

  // Covers the second place the base is joined — the component file URLs.
  online("resolveComponentRemote fetches a full Trinity", async () => {
    const r = await resolveComponentRemote("navbar");
    expect(r).not.toBeNull();
    expect(r!.manifest.name).toBe("navbar");
    expect(r!.files["logic.ts"].length).toBeGreaterThan(0);
    expect(r!.files["view.html"].length).toBeGreaterThan(0);
    expect(r!.files["style.css"].length).toBeGreaterThan(0);
  });
});
