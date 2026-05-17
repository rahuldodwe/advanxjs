import fs from "fs";
import path from "path";
import { compileComponent, compilePages } from "../../../compiler/src/index.ts";

export async function run(args: string[]): Promise<void> {
  const target = path.resolve(args[0] ?? ".");

  try {
    const pagesDir = path.join(target, "src", "pages");
    if (fs.existsSync(pagesDir)) {
      const count = await compilePages(target);
      console.log(`✔ AdvanxJS: Contract Satisfied. ${count} routes wired.`);
    } else {
      if (!args[0]) {
        console.error("Usage: advanx build <component-folder>");
        process.exit(1);
      }
      await compileComponent(target);
      console.log("✔ AdvanxJS: Contract Satisfied. Build successful.");
    }
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}
