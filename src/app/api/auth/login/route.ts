import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema/users";
import { verifyPassword } from "@/domain/auth/password";
import {
  checkRateLimit,
  createUserSession,
  GUEST_CART_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifySignedGuestToken,
} from "@/domain/auth/session";
import { mergeGuestCartIntoUserCart } from "@/domain/cart/service";
import { areDemoAccountsEnabled } from "@/env";
import { assertSameOriginOrJson403, extractClientKey } from "@/lib/http";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const limit = await checkRateLimit(
    "login",
    extractClientKey(request),
    30,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter both email and password." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (!user || !user.isActive || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  if (user.isDemoAccount && !areDemoAccountsEnabled()) {
    return NextResponse.json(
      { error: "Demo accounts are disabled in commercial production." },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  const verifiedGuest = verifySignedGuestToken(
    cookieStore.get(GUEST_CART_COOKIE_NAME)?.value,
  );
  if (verifiedGuest) {
    await mergeGuestCartIntoUserCart(verifiedGuest.tokenHash, user.id, db);
  }

  const session = await createUserSession(user.id, db);
  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
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
