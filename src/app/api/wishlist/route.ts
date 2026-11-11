import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/domain/auth/rbac";
import {
  listUserWishlist,
  toggleWishlistProduct,
} from "@/domain/wishlist/service";
import { assertSameOriginOrJson403 } from "@/lib/http";

export const dynamic = "force-dynamic";

const toggleSchema = z.object({
  productId: z.string().min(1).max(80),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [], authenticated: false });
  }
  const items = await listUserWishlist(user.id);
  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      startingPricePaise: p.startingPricePaise,
      imagePath: p.imagePath,
    })),
    authenticated: true,
  });
}

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to save formulations to your wishlist." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product identifier." },
      { status: 400 },
    );
  }

  try {
    const result = await toggleWishlistProduct(user.id, parsed.data.productId);
    return NextResponse.json({ ok: true, saved: result.saved });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update wishlist." },
      { status: 422 },
    );
  }
}
