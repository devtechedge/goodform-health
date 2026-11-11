import "dotenv/config";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url || !url.trim()) {
  console.error(
    "DATABASE_URL_UNPOOLED or DATABASE_URL is required to run PostgreSQL migrations.",
  );
  process.exit(1);
}

const parsed = new URL(url);
const dbName = parsed.pathname.replace(/^\//, "");
console.log(`Applying Drizzle migrations to database "${dbName}" on host "${parsed.hostname}"...`);

const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool);

try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
  console.log("Migrations applied successfully.");
} finally {
  await pool.end();
}
export {};
