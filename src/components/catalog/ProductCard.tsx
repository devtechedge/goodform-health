"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Plus, Sparkles } from "lucide-react";
import type { HydratedProduct } from "@/domain/catalog/service";
import { formatInrPaise } from "@/lib/india";
import { DietMark } from "@/components/brand/DietMark";
import { PackshotVisual } from "@/components/catalog/PackshotVisual";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartContext";

export interface ProductCardProps {
  product: HydratedProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart, isBusy } = useCart();
  const [wishSaved, setWishSaved] = useState(false);
  const [wishMsg, setWishMsg] = useState<string | null>(null);

  const primaryIngredient = product.ingredientsJson[0];
  const outOfStock = product.totalAvailableStock <= 0;

  const handleWishlist = async () => {
    setWishMsg(null);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (res.status === 401) {
      setWishMsg("Sign in to save");
      return;
    }
    if (res.ok) {
      const data = (await res.json()) as { saved: boolean };
      setWishSaved(data.saved);
    }
  };

  return (
    <article
      data-testid={`product-card-${product.slug}`}
      className="group relative flex min-w-0 flex-col justify-between rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-4 transition-colors hover:border-[var(--gf-border-strong)]"
    >
      <div className="min-w-0">
        <div className="relative">
          <Link href={`/product/${product.slug}`} className="block">
            <PackshotVisual
              imagePath={product.imagePath}
              productName={product.name}
              isDemoSeed={product.isDemoSeed}
              priority={priority}
            />
          </Link>

          <button
            type="button"
            onClick={() => void handleWishlist()}
            aria-label={
              wishSaved
                ? `Remove ${product.name} from wishlist`
                : `Save ${product.name} to wishlist`
            }
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gf-border)] bg-[var(--gf-surface)]/90 text-[var(--gf-ink)] backdrop-blur-sm hover:bg-[var(--gf-surface-muted)]"
          >
            <Heart
              className={`h-4 w-4 ${
                wishSaved ? "fill-[var(--gf-persimmon)] text-[var(--gf-persimmon)]" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        {wishMsg ? (
          <p className="mt-2 text-right text-xs text-[var(--gf-persimmon-ink)]">
            <Link href="/login" className="underline">
              {wishMsg}
            </Link>
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono-label text-[11px] uppercase tracking-[0.14em] text-[var(--gf-ink-muted)]">
            {product.primaryCollection} · {product.supplementForm.replace("_", " ")}
          </span>
          <DietMark dietType={product.dietType} showLabel={false} />
        </div>

        <h3 className="mt-1.5 font-display text-xl leading-snug text-[var(--gf-ink)]">
          <Link
            href={`/product/${product.slug}`}
            className="hover:text-[var(--gf-persimmon)]"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--gf-ink-muted)]">
          {product.subtitle}
        </p>

        {primaryIngredient ? (
          <div className="mt-3 rounded-xl border border-[var(--gf-border)] bg-[var(--gf-surface-muted)] px-3 py-2">
            <p className="font-mono-label text-xs font-medium text-[var(--gf-ink)] truncate">
              {primaryIngredient.amountDisplay} · {primaryIngredient.name}
            </p>
          </div>
        ) : null}

        {product.marketSignalBadge ? (
          <div className="mt-2.5 min-w-0">
            <Badge tone="lilac" className="max-w-full overflow-hidden">
              <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{product.marketSignalBadge}</span>
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--gf-border)] pt-3.5">
        <div>
          <p className="font-mono-label text-base font-semibold text-[var(--gf-ink)]">
            {formatInrPaise(product.startingPricePaise)}
          </p>
          <p className="text-[11px] text-[var(--gf-ink-muted)]">
            {product.servingsPerPack} servings · MRP incl. GST
          </p>
        </div>

        <Button
          variant={outOfStock ? "outline" : "primary"}
          size="sm"
          disabled={outOfStock || isBusy}
          onClick={() => void addToCart(product.defaultVariant.id, 1)}
          aria-label={
            outOfStock
              ? `${product.name} out of stock`
              : `Add ${product.name} to bag`
          }
        >
          {outOfStock ? (
            "Out of Stock"
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add</span>
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
