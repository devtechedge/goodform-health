import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { savedRoutines } from "@/db/schema/users";
import { getCurrentUser } from "@/domain/auth/rbac";
import { assertSameOriginOrJson403 } from "@/lib/http";

export const dynamic = "force-dynamic";

const saveRoutineSchema = z.object({
  title: z.string().trim().min(2).max(80),
  preferences: z.record(z.string(), z.unknown()).default({}),
  productSlugs: z.array(z.string().trim().min(2).max(64)).min(1).max(8),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const db = await getDb();
  const rows = await db
    .select()
    .from(savedRoutines)
    .where(eq(savedRoutines.userId, user.id))
    .orderBy(desc(savedRoutines.createdAt));
  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to save this routine to your account." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = saveRoutineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide a routine title and at least one formulation." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db
    .insert(savedRoutines)
    .values({
      id: `rtn_${randomBytes(12).toString("hex")}`,
      userId: user.id,
      title: parsed.data.title,
      preferencesJson: parsed.data.preferences,
      productSlugsJson: parsed.data.productSlugs,
    })
    .returning();

  return NextResponse.json({ ok: true, routine: created });
}

export async function DELETE(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const db = await getDb();
  await db
    .delete(savedRoutines)
    .where(and(eq(savedRoutines.id, id), eq(savedRoutines.userId, user.id)));

  return NextResponse.json({ ok: true });
}
