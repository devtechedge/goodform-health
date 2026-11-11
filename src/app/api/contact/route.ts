import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { contactInquiries } from "@/db/schema/content";
import { checkRateLimit } from "@/domain/auth/session";
import { dispatchTransactionalEmail } from "@/domain/email/service";
import { assertSameOriginOrJson403, extractClientKey } from "@/lib/http";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  topic: z.enum([
    "Quality & Batch Inquiry",
    "Order & Shipping Support",
    "FSSAI / Regulatory Grievance",
    "General Formulation Question",
  ]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  orderNumber: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10).max(1500),
});

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const limit = await checkRateLimit(
    "contact",
    extractClientKey(request),
    10,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many messages submitted recently. Please wait before retrying." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your inquiry fields." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const id = `inq_${randomBytes(12).toString("hex")}`;
  await db.insert(contactInquiries).values({
    id,
    topic: parsed.data.topic,
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    orderNumber: parsed.data.orderNumber || null,
    message: parsed.data.message,
  });

  await dispatchTransactionalEmail(
    {
      toEmail: parsed.data.email.toLowerCase(),
      subject: `GOODFORM Quality Desk Received [${id.slice(0, 10)}]`,
      templateKey: "contact_ack",
      bodyText: `Hello ${parsed.data.name},\n\nWe logged your "${parsed.data.topic}" note (ref ${id}). Our Mumbai quality and support desk responds within 1-2 business days.`,
    },
    db,
  );

  return NextResponse.json({ ok: true, referenceId: id });
}
