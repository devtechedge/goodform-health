import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema/users";
import {
  createUserSession,
  GUEST_CART_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifySignedGuestToken,
} from "@/domain/auth/session";
import { mergeGuestCartIntoUserCart } from "@/domain/cart/service";
import { areDemoAccountsEnabled } from "@/env";
import { assertSameOriginOrJson403 } from "@/lib/http";

export const dynamic = "force-dynamic";

const demoSchema = z.object({
  persona: z.enum(["customer", "merchandiser", "compliance", "admin"]),
});

const PERSONA_EMAIL: Record<z.infer<typeof demoSchema>["persona"], string> = {
  customer: "aarav@goodform.demo",
  merchandiser: "merchandiser@goodform.demo",
  compliance: "compliance@goodform.demo",
  admin: "admin@goodform.demo",
};

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  if (!areDemoAccountsEnabled()) {
    return NextResponse.json(
      { error: "Demo accounts are strictly disabled when APP_ENV=production." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = demoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid demo persona requested." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, PERSONA_EMAIL[parsed.data.persona]));

  if (!user) {
    return NextResponse.json(
      { error: "Demo persona account has not been seeded." },
      { status: 404 },
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
