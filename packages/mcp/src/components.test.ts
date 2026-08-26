import { describe, expect, test } from "bun:test";
import path from "path";
import { isComponentDir, listComponentDirs } from "./components.ts";

// The MCP bridge used to report every subdirectory as a component — an agent
// asking "what exists here?" was handed `setup` and `__integration__`. The filter
// is a positive Article I check: Trinity present, or it is not a component.

const REPO = path.resolve(import.meta.dir, "../../..");
const TESTS = path.join(REPO, "tests");

describe("listComponentDirs (Article I filter)", () => {
  test("returns exactly the component fixtures", async () => {
    expect(await listComponentDirs(TESTS)).toEqual([
      "counter",
      "form",
      "static",
      "todos",
      "toggle",
    ]);
  });

  test("excludes directories that are not components", async () => {
    const names = await listComponentDirs(TESTS);
    for (const notAComponent of ["setup", "__integration__", "spa-demo"]) {
      expect(names).not.toContain(notAComponent);
    }
  });

  test("rejects a missing directory", async () => {
    await expect(listComponentDirs(path.join(TESTS, "does-not-exist"))).rejects.toThrow();
  });
});

describe("isComponentDir", () => {
  test("true when the full Trinity is present", async () => {
    expect(await isComponentDir(path.join(TESTS, "counter"))).toBe(true);
  });

  test("false for a non-component directory", async () => {
    expect(await isComponentDir(path.join(TESTS, "setup"))).toBe(false);
  });

  test("false for a path that does not exist", async () => {
    expect(await isComponentDir(path.join(TESTS, "does-not-exist"))).toBe(false);
  });
});
