import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import { wishlistItems } from "@/db/schema/commerce";
import {
  loadAllHydratedProducts,
  type HydratedProduct,
} from "@/domain/catalog/service";

export async function toggleWishlistProduct(
  userId: string,
  productId: string,
  dbOverride?: Database,
): Promise<{ saved: boolean }> {
  const db = dbOverride ?? (await getDb());
  const [existing] = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId),
      ),
    );

  if (existing) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
    return { saved: false };
  }

  const all = await loadAllHydratedProducts(db);
  const target = all.find((p) => p.id === productId);
  if (!target || !target.gateVerdict.canAppearInPublicStore) {
    throw new Error("Product is not eligible for wishlist.");
  }

  await db.insert(wishlistItems).values({
    id: `wl_${randomBytes(12).toString("hex")}`,
    userId,
    productId,
  });

  return { saved: true };
}

export async function listUserWishlist(
  userId: string,
  dbOverride?: Database,
): Promise<HydratedProduct[]> {
  const db = dbOverride ?? (await getDb());
  const rows = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));

  if (rows.length === 0) return [];
  const wantedIds = new Set(rows.map((r) => r.productId));
  const all = await loadAllHydratedProducts(db);
  return all.filter(
    (p) => wantedIds.has(p.id) && p.gateVerdict.canAppearInPublicStore,
  );
}
