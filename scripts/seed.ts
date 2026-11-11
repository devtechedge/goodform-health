import "dotenv/config";
import { getEffectiveAppEnv, areDemoAccountsEnabled } from "../src/env";
import { getDb, activeDbDriver } from "../src/db/client";
import { seedDatabase } from "../src/db/seed-runner";

const appEnv = getEffectiveAppEnv();
const driver = activeDbDriver();
const forceDemo = process.argv.includes("--demo");
const reset = process.argv.includes("--reset");

if (driver === "postgres") {
  const rawUrl = process.env.DATABASE_URL ?? "";
  const dbName = new URL(rawUrl).pathname.replace(/^\//, "");
  const isTestDb = dbName.includes("test") || dbName.includes("e2e");
  if (!isTestDb && process.env.ALLOW_PROD_SEED !== "1") {
    console.error(
      `Refusing to seed non-test database "${dbName}" without ALLOW_PROD_SEED=1.`,
    );
    process.exit(1);
  }
}

const includeDemoAccounts =
  appEnv !== "production" && (areDemoAccountsEnabled() || forceDemo);

const db = await getDb();
const summary = await seedDatabase(db, {
  includeDemoAccounts,
  resetExisting: reset,
});

console.log(
  `Seed complete (${driver}, APP_ENV=${appEnv}): ${summary.productCount} SKUs (${summary.publishedCount} published, ${summary.productCount - summary.publishedCount} held), ${summary.variantCount} variants, demoAccounts=${includeDemoAccounts}.`,
);
process.exit(0);
export {};
