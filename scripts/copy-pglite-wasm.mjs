import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
const destDir = join(root, ".vercel/output/functions/__server.func/_libs");

if (!existsSync(destDir)) {
  console.error("[pglite] function output missing:", destDir);
  process.exit(1);
}

for (const name of ["pglite.wasm", "initdb.wasm"]) {
  const from = join(srcDir, name);
  if (!existsSync(from)) {
    console.error("[pglite] missing", from);
    process.exit(1);
  }
  copyFileSync(from, join(destDir, name));
  console.log("[pglite] copied", name);
}
