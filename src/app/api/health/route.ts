import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activeDbDriver, getDb } from "@/db/client";
import { products } from "@/db/schema/catalog";
import {
  areDemoAccountsEnabled,
  getAvailablePaymentProviders,
  getEffectiveAppEnv,
  getEnv,
} from "@/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(products);

    const env = getEnv();
    return NextResponse.json({
      status: "ok",
      brand: "GOODFORM",
      appEnv: getEffectiveAppEnv(),
      storageDriver: activeDbDriver(),
      seededSkuCount: countRow?.total ?? 0,
      paymentProviders: getAvailablePaymentProviders(),
      demoAccountsEnabled: areDemoAccountsEnabled(),
      commitSha: env.VERCEL_GIT_COMMIT_SHA ?? "local",
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", error: "Database health probe failed." },
      { status: 503 },
    );
  }
}
