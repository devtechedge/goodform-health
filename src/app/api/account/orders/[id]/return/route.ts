import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/domain/auth/rbac";
import { OrderDomainError } from "@/domain/orders/service";
import { createCustomerReturnRequest } from "@/domain/orders/transitions";
import { assertSameOriginOrJson403 } from "@/lib/http";

export const dynamic = "force-dynamic";

const returnSchema = z.object({
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().min(5).max(800),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = returnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Select a return reason and include brief details." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  try {
    const created = await createCustomerReturnRequest(
      user.id,
      id,
      parsed.data.reason,
      parsed.data.details,
    );
    return NextResponse.json({ ok: true, returnRequest: created });
  } catch (err) {
    if (err instanceof OrderDomainError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "FORBIDDEN" ? 403 : 404 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not request return." },
      { status: 422 },
    );
  }
}
