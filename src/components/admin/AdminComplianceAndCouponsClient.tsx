"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ComplianceGateRowEditor({
  product,
}: {
  product: {
    id: string;
    sku: string;
    name: string;
    fssaiCategory: string;
    complianceReviewState: string;
    ingredientEligibilityState: string;
    publishStatus: string;
    fboLicenseNumber: string | null;
    fboLicenseVerified: boolean;
    holdReason: string | null;
    isDemoSeed: boolean;
    violations: Array<{ code: string; message: string }>;
  };
}) {
  const router = useRouter();
  const [reviewState, setReviewState] = useState(product.complianceReviewState);
  const [eligibility, setEligibility] = useState(
    product.ingredientEligibilityState,
  );
  const [publishStatus, setPublishStatus] = useState(product.publishStatus);
  const [fboNum, setFboNum] = useState(product.fboLicenseNumber ?? "");
  const [fboVer, setFboVer] = useState(product.fboLicenseVerified);
  const [holdReason, setHoldReason] = useState(product.holdReason ?? "");
  const [isDemoSeed, setIsDemoSeed] = useState(product.isDemoSeed);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateProductCompliance",
        productId: product.id,
        complianceReviewState: reviewState,
        ingredientEligibilityState: eligibility,
        publishStatus,
        fboLicenseNumber: fboNum.trim() || null,
        fboLicenseVerified: fboVer,
        holdReason: holdReason.trim() || null,
        isDemoSeed,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setFeedback({ ok: false, text: data.error ?? "Gate blocked transition." });
      return;
    }
    setFeedback({ ok: true, text: "Compliance state updated & audited." });
    router.refresh();
  };

  return (
    <form
      onSubmit={onSave}
      data-testid={`compliance-row-${product.sku}`}
      className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 space-y-3 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-mono-label text-[var(--gf-ink-muted)]">
            {product.sku} · {product.fssaiCategory}
          </span>
          <h2 className="font-display text-xl text-[var(--gf-ink)]">
            {product.name}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 font-mono-label font-semibold ${
            product.violations.length === 0 && product.publishStatus === "PUBLISHED"
              ? "bg-[var(--gf-verbena-soft)] text-[var(--gf-verbena-ink)]"
              : "bg-[var(--gf-amber-soft)] text-[var(--gf-amber-ink)]"
          }`}
        >
          {product.violations.length === 0 && product.publishStatus === "PUBLISHED"
            ? "GATE CLEAR · PUBLISHED"
            : `BLOCKED (${product.violations.length} rule(s))`}
        </span>
      </div>

      {product.violations.length > 0 ? (
        <ul className="rounded-xl bg-[var(--gf-amber-soft)] p-3 text-[var(--gf-amber-ink)] list-disc pl-6 space-y-1">
          {product.violations.map((v) => (
            <li key={v.code}>{v.message}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label
            htmlFor={`cg-rev-${product.id}`}
            className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
          >
            Review State
          </label>
          <select
            id={`cg-rev-${product.id}`}
            value={reviewState}
            onChange={(e) => setReviewState(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2"
          >
            <option value="APPROVED_DEMO_SEED">APPROVED_DEMO_SEED</option>
            <option value="PENDING_LEGAL_REVIEW">PENDING_LEGAL_REVIEW</option>
            <option value="PENDING_REGULATORY_REVIEW">PENDING_REGULATORY_REVIEW</option>
            <option value="PENDING_BOTANICAL_REVIEW">PENDING_BOTANICAL_REVIEW</option>
            <option value="PENDING_NON_SPECIFIED_REVIEW">PENDING_NON_SPECIFIED_REVIEW</option>
            <option value="OWNER_VERIFIED">OWNER_VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`cg-elg-${product.id}`}
            className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
          >
            Ingredient Eligibility
          </label>
          <select
            id={`cg-elg-${product.id}`}
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2"
          >
            <option value="ELIGIBLE_WITHIN_LIMITS">ELIGIBLE_WITHIN_LIMITS</option>
            <option value="PENDING_SCHEDULE_IV_BOTANICAL">PENDING_SCHEDULE_IV_BOTANICAL</option>
            <option value="PENDING_NON_SPECIFIED_APPROVAL">PENDING_NON_SPECIFIED_APPROVAL</option>
            <option value="PENDING_LEGAL_CLASSIFICATION">PENDING_LEGAL_CLASSIFICATION</option>
            <option value="PENDING_REGULATORY_REVIEW">PENDING_REGULATORY_REVIEW</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`cg-pub-${product.id}`}
            className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
          >
            Publish Status
          </label>
          <select
            id={`cg-pub-${product.id}`}
            value={publishStatus}
            onChange={(e) => setPublishStatus(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2"
          >
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="UNPUBLISHED_HOLD">UNPUBLISHED_HOLD</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`cg-fbo-${product.id}`}
            className="block font-mono-label text-[10px] uppercase text-[var(--gf-ink-muted)]"
          >
            14-Digit FoSCoS FBO No.
          </label>
          <input
            id={`cg-fbo-${product.id}`}
            type="text"
            maxLength={14}
            value={fboNum}
            onChange={(e) => setFboNum(e.target.value)}
            placeholder="Unverified (Demo)"
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2 font-mono-label"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={fboVer}
            onChange={(e) => setFboVer(e.target.checked)}
            className="accent-[var(--gf-persimmon)]"
          />
          <span>FoSCoS Licence Owner-Verified</span>
        </label>

        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={isDemoSeed}
            onChange={(e) => setIsDemoSeed(e.target.checked)}
            className="accent-[var(--gf-persimmon)]"
          />
          <span>Demo Seed Flag</span>
        </label>

        <input
          type="text"
          value={holdReason}
          onChange={(e) => setHoldReason(e.target.value)}
          placeholder="Hold reason..."
          aria-label="Hold reason"
          className="min-h-8 flex-1 min-w-[200px] rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2.5"
        />

        <Button type="submit" variant="secondary" size="sm" disabled={busy}>
          {busy ? "Evaluating Gate..." : "Apply Gate Update"}
        </Button>
      </div>

      {feedback ? (
        <p
          role="alert"
          className={`font-medium ${
            feedback.ok
              ? "text-[var(--gf-verbena-ink)]"
              : "text-[var(--gf-persimmon-ink)]"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}
    </form>
  );
}

export function CouponUpsertForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED_PAISE">(
    "PERCENT",
  );
  const [discountValue, setDiscountValue] = useState("15");
  const [minInr, setMinInr] = useState("1499");
  const [isActive, setIsActive] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const valNum = Number(discountValue);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsertCoupon",
        code,
        description,
        discountType,
        discountValue:
          discountType === "FIXED_PAISE" ? Math.round(valNum * 100) : valNum,
        minSubtotalPaise: Math.round(Number(minInr) * 100),
        maxDiscountPaise: discountType === "PERCENT" ? 75000 : null,
        isActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Failed to save coupon.");
      return;
    }
    setCode("");
    setDescription("");
    setMsg("Saved coupon & logged audit record.");
    router.refresh();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4 text-xs"
    >
      <h2 className="font-display text-2xl text-[var(--gf-ink)]">
        Create or Update Coupon
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cpn-code" className="block font-mono-label uppercase text-[var(--gf-ink-muted)]">
            Code
          </label>
          <input
            id="cpn-code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MONSOON15"
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 font-mono-label"
          />
        </div>
        <div>
          <label htmlFor="cpn-desc" className="block font-mono-label uppercase text-[var(--gf-ink-muted)]">
            Description
          </label>
          <input
            id="cpn-desc"
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="15% off orders above INR 1,499"
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3"
          />
        </div>
        <div>
          <label htmlFor="cpn-type" className="block font-mono-label uppercase text-[var(--gf-ink-muted)]">
            Discount Type
          </label>
          <select
            id="cpn-type"
            value={discountType}
            onChange={(e) =>
              setDiscountType(e.target.value as "PERCENT" | "FIXED_PAISE")
            }
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3"
          >
            <option value="PERCENT">Percentage (%)</option>
            <option value="FIXED_PAISE">Flat INR Amount</option>
          </select>
        </div>
        <div>
          <label htmlFor="cpn-val" className="block font-mono-label uppercase text-[var(--gf-ink-muted)]">
            {discountType === "PERCENT" ? "Percent (%)" : "Flat INR"}
          </label>
          <input
            id="cpn-val"
            type="number"
            min={1}
            required
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 font-mono-label"
          />
        </div>
        <div>
          <label htmlFor="cpn-min" className="block font-mono-label uppercase text-[var(--gf-ink-muted)]">
            Min Cart Value (INR)
          </label>
          <input
            id="cpn-min"
            type="number"
            min={0}
            required
            value={minInr}
            onChange={(e) => setMinInr(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 font-mono-label"
          />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 pb-2.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-[var(--gf-persimmon)]"
            />
            <span>Coupon Active</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="sm">
          Save Coupon
        </Button>
        {msg ? <span>{msg}</span> : null}
      </div>
    </form>
  );
}
