import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "drizzle");
const files = readdirSync(dir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  throw new Error("No SQL migrations found in ./drizzle. Run drizzle-kit generate first.");
}

const sql = files
  .map((file) =>
    readFileSync(join(dir, file), "utf8").replace(/--> statement-breakpoint/g, ""),
  )
  .join("\n");

const header =
  "// AUTO-GENERATED from drizzle/*.sql by scripts/gen-ddl.ts. Do not edit manually.\n";
writeFileSync(
  join(process.cwd(), "src/db/ddl.ts"),
  `${header}export const ddl = ${JSON.stringify(sql)};\n`,
  "utf8",
);
console.log(`Generated src/db/ddl.ts from ${files.length} migration(s) (${sql.length} chars).`);
export {};
