import fs from "fs";
import path from "path";
import {
  listComponents,
  resolveComponent,
  componentExists,
} from "../../../registry/src/index.ts";
import { compileComponent } from "../../../compiler/src/index.ts";

export async function run(args: string[]): Promise<void> {
  const arg = args[0];

  // Handle --list flag
  if (arg === "--list" || arg === "-l") {
    listAvailableComponents();
    return;
  }

  // No argument provided
  if (!arg) {
    console.error("Usage: advanx add <component-name>");
    console.error("       advanx add --list");
    process.exit(1);
  }

  const componentName = arg;
  await addComponent(componentName);
}

function listAvailableComponents(): void {
  const components = listComponents();

  if (components.length === 0) {
    console.log("No components available in the registry.");
    return;
  }

  console.log("Available components:\n");
  for (const comp of components) {
    const tierBadge = comp.tier === "free" ? "" : " [premium]";
    console.log(`  - ${comp.name}${tierBadge}`);
    console.log(`    ${comp.description}`);
    if (comp.tags.length > 0) {
      console.log(`    Tags: ${comp.tags.join(", ")}`);
    }
    console.log();
  }
}

async function addComponent(name: string): Promise<void> {
  // Check if component exists in registry
  if (!componentExists(name)) {
    console.error(`Component "${name}" not found in registry.`);
    console.error("Run 'advanx add --list' to see available components.");
    process.exit(1);
  }

  // Resolve component files
  const component = resolveComponent(name);
  if (!component) {
    console.error(`Failed to resolve component "${name}".`);
    process.exit(1);
  }

  // Determine target directory
  const cwd = process.cwd();
  const targetDir = path.join(cwd, "src", "components", name);

  // Check for conflicts
  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      console.error(`Component already exists at: ${targetDir}`);
      console.error("Remove the existing component first or choose a different name.");
      process.exit(1);
    }
  }

  // Create target directory
  fs.mkdirSync(targetDir, { recursive: true });

  // Write component files
  const filesToWrite = [
    { name: "logic.ts", content: component.files["logic.ts"] },
    { name: "view.html", content: component.files["view.html"] },
    { name: "style.css", content: component.files["style.css"] },
  ];

  for (const file of filesToWrite) {
    const filePath = path.join(targetDir, file.name);
    fs.writeFileSync(filePath, file.content, "utf-8");
  }

  console.log(`✔ Added component "${name}" to src/components/${name}/`);

  // Run build on the new component
  try {
    await compileComponent(targetDir);
    console.log(`✔ Built component successfully.`);
  } catch (err: any) {
    console.warn(`⚠ Build warning: ${err.message}`);
    console.warn("  You may need to run 'advanx build' manually.");
  }

  // Print usage hints
  console.log();
  console.log("Usage hints:");
  console.log(`  1. Import and use in your pages or other components`);
  console.log(`  2. Customize the signals in logic.ts`);
  console.log(`  3. Modify the template in view.html`);
  console.log(`  4. Style with style.css`);
}
