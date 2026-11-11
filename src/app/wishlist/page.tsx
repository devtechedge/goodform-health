import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/domain/auth/rbac";
import { listUserWishlist } from "@/domain/wishlist/service";
import { ProductCard } from "@/components/catalog/ProductCard";
import { buttonClasses } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Wishlist",
  alternates: { canonical: "/wishlist" },
};

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-4xl text-[var(--gf-ink)]">
          Sign in to view your saved formulations
        </h1>
        <p className="text-sm text-[var(--gf-ink-muted)]">
          Wishlists sync to your GOODFORM account so you can revisit single nutrients across devices.
        </p>
        <div className="pt-2">
          <Link
            href="/login?next=/wishlist"
            className={buttonClasses({ variant: "primary" })}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const items = await listUserWishlist(user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl text-[var(--gf-ink)]">
        Saved Wishlist ({items.length})
      </h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-10 text-center space-y-3">
          <p className="font-display text-2xl">No saved formulations yet</p>
          <p className="text-sm text-[var(--gf-ink-muted)]">
            Tap the heart icon on any published formulation card to save it here.
          </p>
          <div className="pt-2">
            <Link href="/shop" className={buttonClasses({ variant: "primary" })}>
              Browse Formulations
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
