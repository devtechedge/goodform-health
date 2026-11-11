import { NextResponse } from "next/server";
import { getCurrentUser } from "@/domain/auth/rbac";
import {
  OrderDomainError,
  reorderPreviousOrderIntoCart,
} from "@/domain/orders/service";
import { assertSameOriginOrJson403 } from "@/lib/http";

export const dynamic = "force-dynamic";

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

  const { id } = await context.params;

  try {
    const result = await reorderPreviousOrderIntoCart(user.id, id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof OrderDomainError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "FORBIDDEN" ? 403 : 404 },
      );
    }
    return NextResponse.json(
      { error: "Unable to reorder items." },
      { status: 500 },
    );
  }
}
