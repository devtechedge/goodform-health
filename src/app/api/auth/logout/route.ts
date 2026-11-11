import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revokeUserSession, SESSION_COOKIE_NAME } from "@/domain/auth/session";
import { assertSameOriginOrJson403 } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  await revokeUserSession(raw);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
