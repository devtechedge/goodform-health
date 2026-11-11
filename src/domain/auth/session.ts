import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import { rateLimitBuckets, sessions, users } from "@/db/schema/users";
import { areDemoAccountsEnabled, getEnv } from "@/env";

export const SESSION_COOKIE_NAME = "gf_session";
export const GUEST_CART_COOKIE_NAME = "gf_guest_cart";
const SESSION_TTL_DAYS = 14;

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashClientIdentifier(rawIdentifier: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET)
    .update(rawIdentifier)
    .digest("hex")
    .slice(0, 32);
}

export function createSignedGuestToken(rawCartToken?: string): {
  rawToken: string;
  cookieValue: string;
  tokenHash: string;
} {
  const rawToken = rawCartToken ?? randomBytes(24).toString("base64url");
  const sig = createHmac("sha256", getEnv().SESSION_SECRET)
    .update(`guest:${rawToken}`)
    .digest("base64url");
  return {
    rawToken,
    cookieValue: `${rawToken}.${sig}`,
    tokenHash: sha256Hex(rawToken),
  };
}

export function verifySignedGuestToken(
  cookieValue: string | undefined | null,
): { rawToken: string; tokenHash: string } | null {
  if (!cookieValue || !cookieValue.includes(".")) return null;
  const [rawToken, sig] = cookieValue.split(".");
  if (!rawToken || !sig) return null;
  const expected = createHmac("sha256", getEnv().SESSION_SECRET)
    .update(`guest:${rawToken}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  return { rawToken, tokenHash: sha256Hex(rawToken) };
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "MERCHANDISER" | "COMPLIANCE_OFFICER" | "ADMIN";
  phone: string | null;
  isDemoAccount: boolean;
}

export async function createUserSession(
  userId: string,
  dbOverride?: Database,
): Promise<{ rawToken: string; expiresAt: Date }> {
  const db = dbOverride ?? (await getDb());
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await db.insert(sessions).values({
    id: `ses_${randomBytes(12).toString("hex")}`,
    userId,
    tokenHash,
    expiresAt,
  });

  return { rawToken, expiresAt };
}

export async function resolveSessionUser(
  rawSessionCookie: string | undefined | null,
  dbOverride?: Database,
): Promise<AuthenticatedUser | null> {
  if (!rawSessionCookie || rawSessionCookie.trim().length < 16) return null;
  const db = dbOverride ?? (await getDb());
  const tokenHash = sha256Hex(rawSessionCookie.trim());

  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      phone: users.phone,
      isDemoAccount: users.isDemoAccount,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash));

  if (!row) return null;
  if (!row.isActive || row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }

  // Enforce commercial production lockout on seeded demo accounts
  if (row.isDemoAccount && !areDemoAccountsEnabled()) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    phone: row.phone,
    isDemoAccount: row.isDemoAccount,
  };
}

export async function revokeUserSession(
  rawSessionCookie: string | undefined | null,
  dbOverride?: Database,
): Promise<void> {
  if (!rawSessionCookie) return;
  const db = dbOverride ?? (await getDb());
  await db
    .delete(sessions)
    .where(eq(sessions.tokenHash, sha256Hex(rawSessionCookie.trim())));
}

export function verifySameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) {
    // Same-origin fetch in tests without explicit Origin header is permitted only for non-browser tests when Sec-Fetch-Site is absent or same-origin
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
      return false;
    }
    return true;
  }
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export async function checkRateLimit(
  actionName: string,
  rawClientId: string,
  maxHits: number,
  windowMs: number,
  dbOverride?: Database,
): Promise<{ allowed: boolean; remaining: number }> {
  const db = dbOverride ?? (await getDb());
  const bucketKey = `${actionName}:${hashClientIdentifier(rawClientId)}`;
  const now = new Date();

  const [existing] = await db
    .select()
    .from(rateLimitBuckets)
    .where(eq(rateLimitBuckets.key, bucketKey));

  if (
    !existing ||
    now.getTime() - existing.windowStart.getTime() >= windowMs
  ) {
    await db
      .insert(rateLimitBuckets)
      .values({ key: bucketKey, hits: 1, windowStart: now })
      .onConflictDoUpdate({
        target: rateLimitBuckets.key,
        set: { hits: 1, windowStart: now },
      });
    return { allowed: true, remaining: Math.max(0, maxHits - 1) };
  }

  if (existing.hits >= maxHits) {
    return { allowed: false, remaining: 0 };
  }

  const nextHits = existing.hits + 1;
  await db
    .update(rateLimitBuckets)
    .set({ hits: nextHits })
    .where(eq(rateLimitBuckets.key, bucketKey));

  return { allowed: true, remaining: Math.max(0, maxHits - nextHits) };
}
