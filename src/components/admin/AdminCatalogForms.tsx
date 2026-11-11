"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ProductMerchandisingEditor({
  product,
}: {
  product: {
    id: string;
    sku: string;
    name: string;
    subtitle: string;
    shortSummary: string;
    featuredRank: number | null;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [subtitle, setSubtitle] = useState(product.subtitle);
  const [shortSummary, setShortSummary] = useState(product.shortSummary);
  const [rank, setRank] = useState(
    product.featuredRank !== null ? String(product.featuredRank) : "",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateProduct",
        productId: product.id,
        name,
        subtitle,
        shortSummary,
        featuredRank: rank.trim() ? Number(rank) : null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(`Error: ${data.error}`);
      return;
    }
    setMsg("Saved & logged to audit trail.");
    router.refresh();
  };

  return (
    <form onSubmit={onSave} className="space-y-2.5 text-xs">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label
            htmlFor={`pm-name-${product.id}`}
            className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
          >
            Display Name
          </label>
          <input
            id={`pm-name-${product.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-0.5 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2.5 text-xs"
          />
        </div>
        <div>
          <label
            htmlFor={`pm-rank-${product.id}`}
            className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
          >
            Home Rank
          </label>
          <input
            id={`pm-rank-${product.id}`}
            type="number"
            min={1}
            max={999}
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            placeholder="None"
            className="mt-0.5 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2.5 font-mono-label text-xs"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`pm-sub-${product.id}`}
          className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
        >
          Subtitle
        </label>
        <input
          id={`pm-sub-${product.id}`}
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="mt-0.5 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2.5 text-xs"
        />
      </div>

      <div>
        <label
          htmlFor={`pm-sum-${product.id}`}
          className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
        >
          Summary (Checked by FSSAI Claims Validator)
        </label>
        <textarea
          id={`pm-sum-${product.id}`}
          rows={2}
          value={shortSummary}
          onChange={(e) => setShortSummary(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] p-2 text-xs"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={busy}>
          {busy ? "Saving..." : "Save Merchandising"}
        </Button>
        {msg ? <span className="text-[var(--gf-ink-muted)]">{msg}</span> : null}
      </div>
    </form>
  );
}

export function VariantInventoryRowEditor({
  variant,
}: {
  variant: {
    id: string;
    sku: string;
    title: string;
    pricePaise: number;
    stockOnHand: number;
    batchNumber: string;
    expiryDate: string;
  };
}) {
  const router = useRouter();
  const [priceInr, setPriceInr] = useState(String(variant.pricePaise / 100));
  const [stock, setStock] = useState(String(variant.stockOnHand));
  const [batch, setBatch] = useState(variant.batchNumber);
  const [expiry, setExpiry] = useState(variant.expiryDate);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateVariantInventory",
        variantId: variant.id,
        pricePaise: Math.round(Number(priceInr) * 100),
        stockOnHand: Number(stock),
        batchNumber: batch,
        expiryDate: expiry,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setMsg("Updated");
    router.refresh();
  };

  return (
    <form
      onSubmit={onSave}
      className="grid gap-2 rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3 text-xs sm:grid-cols-6 sm:items-end"
    >
      <div className="sm:col-span-2">
        <p className="font-semibold text-[var(--gf-ink)]">{variant.title}</p>
        <p className="font-mono-label text-[11px] text-[var(--gf-ink-muted)]">
          {variant.sku}
        </p>
      </div>
      <div>
        <label
          htmlFor={`vi-price-${variant.id}`}
          className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
        >
          MRP (INR)
        </label>
        <input
          id={`vi-price-${variant.id}`}
          type="number"
          step="1"
          min={100}
          value={priceInr}
          onChange={(e) => setPriceInr(e.target.value)}
          className="mt-0.5 min-h-8 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2 font-mono-label text-xs"
        />
      </div>
      <div>
        <label
          htmlFor={`vi-stock-${variant.id}`}
          className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
        >
          Stock
        </label>
        <input
          id={`vi-stock-${variant.id}`}
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="mt-0.5 min-h-8 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2 font-mono-label text-xs"
        />
      </div>
      <div>
        <label
          htmlFor={`vi-batch-${variant.id}`}
          className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
        >
          Batch / Exp
        </label>
        <div className="mt-0.5 flex gap-1">
          <input
            id={`vi-batch-${variant.id}`}
            type="text"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            aria-label="Batch number"
            className="min-h-8 w-20 rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-1.5 font-mono-label text-[11px]"
          />
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            aria-label="Expiry date YYYY-MM-DD"
            className="min-h-8 w-24 rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-1.5 font-mono-label text-[11px]"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" size="sm" disabled={busy}>
          Save
        </Button>
        {msg ? <span className="text-[11px]">{msg}</span> : null}
      </div>
    </form>
  );
}
