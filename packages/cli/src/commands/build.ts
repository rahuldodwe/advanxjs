import path from "path";
import { compileComponent } from "../../../compiler/src/index.ts";

export async function run(args: string[]): Promise<void> {
  const target = args[0];
  if (!target) {
    console.error("Usage: advanx build <component-folder>");
    process.exit(1);
  }

  try {
    await compileComponent(path.resolve(target));
    console.log("✔ AdvanxJS: Contract Satisfied. Build successful.");
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}
