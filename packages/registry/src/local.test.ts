import { describe, expect, test } from "bun:test";
import { componentExists, listComponents, resolveComponent } from "./sources/local.ts";

describe("local registry", () => {
  test("lists every on-disk component", () => {
    const list = listComponents();
    const names = list.map((c) => c.name);
    expect(names).toContain("navbar");
    expect(names).toContain("pricing-table");
    expect(list.length).toBeGreaterThanOrEqual(10);
  });

  test("componentExists reflects presence", () => {
    expect(componentExists("navbar")).toBe(true);
    expect(componentExists("does-not-exist")).toBe(false);
  });

  test("resolveComponent returns the full Trinity", () => {
    const r = resolveComponent("navbar");
    expect(r).not.toBeNull();
    expect(r!.files["logic.ts"].length).toBeGreaterThan(0);
    expect(r!.files["view.html"].length).toBeGreaterThan(0);
    expect(r!.files["style.css"].length).toBeGreaterThan(0);
    expect(r!.manifest.name).toBe("navbar");
  });

  test("resolveComponent returns null for a missing component", () => {
    expect(resolveComponent("nope")).toBeNull();
  });
});
