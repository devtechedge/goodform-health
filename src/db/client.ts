import type { PgliteDatabase } from "drizzle-orm/pglite";
import { getEnv, getEffectiveAppEnv } from "@/env";
import * as schema from "./schema";
import { bootstrapPglite } from "./bootstrap";
import { normalizePgConnectionString } from "./url";

export type Database = PgliteDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbExecutor = Database | Transaction;
export type DbDriver = "postgres" | "pglite";

type SeederFn = (db: Database) => Promise<void>;

const globalDb = globalThis as typeof globalThis & {
  __goodformDbPromise?: Promise<Database>;
  __goodformDbDriver?: DbDriver;
  __goodformPgliteSeeder?: SeederFn;
};

export function registerPgliteSeeder(seeder: SeederFn): void {
  globalDb.__goodformPgliteSeeder = seeder;
}

export function activeDbDriver(): DbDriver {
  const url = getEnv().DATABASE_URL;
  return url && url.trim().length > 0 ? "postgres" : "pglite";
}

async function createPostgresDb(connectionString: string): Promise<Database> {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: normalizePgConnectionString(connectionString),
    max: 6,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return drizzle(pool, { schema }) as unknown as Database;
}

async function createPgliteDb(): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  await client.waitReady;
  await bootstrapPglite(client);
  const db = drizzle(client, { schema });

  if (getEffectiveAppEnv() !== "production") {
    if (globalDb.__goodformPgliteSeeder) {
      await globalDb.__goodformPgliteSeeder(db);
    } else {
      const { seedDatabase } = await import("./seed-runner");
      await seedDatabase(db, { includeDemoAccounts: true });
    }
  }
  return db;
}

export function getDb(): Promise<Database> {
  if (typeof window !== "undefined") {
    throw new Error("@/db/client is server-only.");
  }
  if (!globalDb.__goodformDbPromise) {
    const driver = activeDbDriver();
    globalDb.__goodformDbDriver = driver;
    globalDb.__goodformDbPromise = (
      driver === "postgres"
        ? createPostgresDb(getEnv().DATABASE_URL!.trim())
        : createPgliteDb()
    ).catch((err) => {
      globalDb.__goodformDbPromise = undefined;
      throw err;
    });
  }
  return globalDb.__goodformDbPromise;
}

export async function createFreshTestDb(): Promise<{
  db: Database;
  cleanup: () => Promise<void>;
}> {
  const testUrl = process.env.TEST_DATABASE_URL?.trim();
  if (testUrl) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: normalizePgConnectionString(testUrl),
      max: 4,
    });
    const db = drizzle(pool, { schema }) as unknown as Database;
    const { seedDatabase } = await import("./seed-runner");
    await seedDatabase(db, { includeDemoAccounts: true, resetExisting: true });
    return {
      db,
      cleanup: async () => {
        await pool.end();
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  await client.waitReady;
  await bootstrapPglite(client);
  const db = drizzle(client, { schema });
  const { seedDatabase } = await import("./seed-runner");
  await seedDatabase(db, { includeDemoAccounts: true });
  return {
    db,
    cleanup: async () => {
      await client.close();
    },
  };
}
