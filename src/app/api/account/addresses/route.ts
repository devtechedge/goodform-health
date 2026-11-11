import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { addresses } from "@/db/schema/users";
import { getCurrentUser } from "@/domain/auth/rbac";
import { assertSameOriginOrJson403 } from "@/lib/http";
import {
  getStateByCode,
  isValidIndianMobile,
  isValidIndianPin,
} from "@/lib/india";

export const dynamic = "force-dynamic";

const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(20),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  stateCode: z.string().trim().length(2),
  pinCode: z.string().trim().length(6),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const db = await getDb();
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id));
  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createAddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid address." },
      { status: 400 },
    );
  }

  if (!isValidIndianPin(parsed.data.pinCode)) {
    return NextResponse.json(
      { error: "Enter a valid 6-digit Indian PIN code." },
      { status: 400 },
    );
  }
  if (!getStateByCode(parsed.data.stateCode)) {
    return NextResponse.json(
      { error: "Select a valid Indian state." },
      { status: 400 },
    );
  }
  if (!isValidIndianMobile(parsed.data.phone)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number." },
      { status: 400 },
    );
  }

  const db = await getDb();
  if (parsed.data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, user.id));
  }

  const [created] = await db
    .insert(addresses)
    .values({
      id: `addr_${randomBytes(12).toString("hex")}`,
      userId: user.id,
      label: parsed.data.label,
      recipientName: parsed.data.recipientName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      landmark: parsed.data.landmark || null,
      city: parsed.data.city,
      stateCode: parsed.data.stateCode.toUpperCase(),
      pinCode: parsed.data.pinCode,
      isDefault: parsed.data.isDefault,
    })
    .returning();

  return NextResponse.json({ ok: true, address: created });
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
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));

  return NextResponse.json({ ok: true });
}
