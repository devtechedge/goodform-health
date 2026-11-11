import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema/users";
import { hashPassword } from "@/domain/auth/password";
import {
  checkRateLimit,
  createUserSession,
  GUEST_CART_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifySignedGuestToken,
} from "@/domain/auth/session";
import { mergeGuestCartIntoUserCart } from "@/domain/cart/service";
import { assertSameOriginOrJson403, extractClientKey } from "@/lib/http";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  password: z.string().min(10, "Password must be at least 10 characters.").max(128),
  phone: z.string().trim().max(24).optional(),
});

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const limit = await checkRateLimit(
    "signup",
    extractClientKey(request),
    20,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please wait before trying again." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  if (email.endsWith("@goodform.demo")) {
    return NextResponse.json(
      { error: "Reserved demo domain cannot be registered manually." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const userId = `usr_${randomBytes(12).toString("hex")}`;
  await db.insert(users).values({
    id: userId,
    email,
    fullName: parsed.data.fullName,
    passwordHash: hashPassword(parsed.data.password),
    role: "CUSTOMER",
    phone: parsed.data.phone || null,
    isDemoAccount: false,
    isActive: true,
  });

  const cookieStore = await cookies();
  const verifiedGuest = verifySignedGuestToken(
    cookieStore.get(GUEST_CART_COOKIE_NAME)?.value,
  );
  if (verifiedGuest) {
    await mergeGuestCartIntoUserCart(verifiedGuest.tokenHash, userId, db);
  }

  const session = await createUserSession(userId, db);
  const res = NextResponse.json({
    ok: true,
    user: { id: userId, email, fullName: parsed.data.fullName, role: "CUSTOMER" },
  });

  res.cookies.set(SESSION_COOKIE_NAME, session.rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  });
  res.cookies.delete(GUEST_CART_COOKIE_NAME);
  return res;
}
