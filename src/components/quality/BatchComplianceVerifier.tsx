"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface VerifiedBatchRecord {
  productName: string;
  productSlug: string;
  productSku: string;
  variantSku: string;
  variantTitle: string;
  batchNumber: string;
  manufacturedDate: string;
  expiryDate: string;
  jurisdiction: string;
  fssaiCategory: string;
  complianceReviewState: string;
  publishStatus: string;
  canAppearInPublicStore: boolean;
  holdReason: string | null;
  violations: Array<{ code: string; message: string }>;
  ingredients: Array<{
    name: string;
    compoundForm: string;
    amountDisplay: string;
  }>;
  fboLicenseStatus: string;
  coaStatus: string;
  manufacturerName: string;
  isDemoSeed: boolean;
}

export function BatchComplianceVerifier() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<VerifiedBatchRecord | null>(null);

  const runLookup = async (targetCode: string) => {
    const trimmed = targetCode.trim();
    if (!trimmed) return;
    setCode(trimmed);
    setBusy(true);
    setError(null);
    setRecord(null);
    try {
      const res = await fetch(
        `/api/compliance/verify?code=${encodeURIComponent(trimmed)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No matching record found.");
        return;
      }
      setRecord(data.record as VerifiedBatchRecord);
    } catch {
      setError("Network error while querying compliance ledger.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="batch-verifier-heading"
      className="rounded-3xl border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-5"
    >
      <div className="space-y-1">
        <Badge tone="lilac">Interactive Provenance &amp; Gate Lookup</Badge>
        <h2
          id="batch-verifier-heading"
          className="font-display text-2xl text-[var(--gf-ink)] sm:text-3xl"
        >
          Verify Any Batch Number or SKU Code
        </h2>
        <p className="text-xs sm:text-sm text-[var(--gf-ink-muted)]">
          Enter a jar Batch Number or SKU across all 40 seeded formulations to inspect elemental assay targets, shelf-life dates, India FSSAI gate status, and honest demo-evidence flags.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runLookup(code);
        }}
        className="flex flex-col gap-2.5 sm:flex-row"
      >
        <label htmlFor="batch-lookup-input" className="sr-only">
          Batch number or SKU code
        </label>
        <input
          id="batch-lookup-input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. GF26K04D, GF-ANT-001, or GF-ACT-027"
          className="min-h-11 flex-1 min-w-0 rounded-full border border-[var(--gf-border-strong)] bg-[var(--gf-bg)] px-4 font-mono-label text-sm uppercase"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={busy}
          data-testid="batch-lookup-submit"
          className="min-h-11"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>{busy ? "Checking..." : "Inspect Record"}</span>
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[var(--gf-ink-muted)]">Try sample codes:</span>
        <button
          type="button"
          onClick={() => void runLookup("GF26K04D")}
          className="rounded-full border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 py-1 font-mono-label hover:border-[var(--gf-persimmon)]"
        >
          GF26K04D (Magnesium Batch)
        </button>
        <button
          type="button"
          onClick={() => void runLookup("GF-ACT-027")}
          className="rounded-full border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 py-1 font-mono-label hover:border-[var(--gf-persimmon)]"
        >
          GF-ACT-027 (Shilajit Legal Hold)
        </button>
        <button
          type="button"
          onClick={() => void runLookup("GF-ANT-034")}
          className="rounded-full border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 py-1 font-mono-label hover:border-[var(--gf-persimmon)]"
        >
          GF-ANT-034 (NAC Regulatory Hold)
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-[var(--gf-persimmon)]/40 bg-[var(--gf-persimmon-soft)] p-3 text-xs font-medium text-[var(--gf-persimmon-ink)]"
        >
          {error}
        </p>
      ) : null}

      {record ? (
        <div
          data-testid="batch-verifier-result"
          className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-5 space-y-4 text-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--gf-border)] pb-3">
            <div>
              <p className="font-mono-label text-[var(--gf-ink-muted)]">
                {record.productSku} · Batch {record.batchNumber}
              </p>
              <h3 className="mt-0.5 font-display text-2xl text-[var(--gf-ink)]">
                {record.productName} ({record.variantTitle})
              </h3>
            </div>
            <Badge
              tone={record.canAppearInPublicStore ? "verbena" : "amber"}
            >
              {record.canAppearInPublicStore
                ? "PUBLISHED · GATE CLEAR"
                : `WITHHELD (${record.complianceReviewState})`}
            </Badge>
          </div>

          {record.holdReason ? (
            <p className="rounded-xl border border-[var(--gf-amber-border)] bg-[var(--gf-amber-soft)] p-3 text-[var(--gf-amber-ink)]">
              <strong>India Publishing Gate Hold:</strong> {record.holdReason}
            </p>
          ) : null}

          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="font-mono-label uppercase text-[10px] text-[var(--gf-ink-muted)]">
                FSSAI Category
              </dt>
              <dd className="mt-0.5 font-semibold text-[var(--gf-ink)]">
                {record.fssaiCategory.replace(/_/g, " ")} ({record.jurisdiction})
              </dd>
            </div>
            <div>
              <dt className="font-mono-label uppercase text-[10px] text-[var(--gf-ink-muted)]">
                Mfg / Best Before
              </dt>
              <dd className="mt-0.5 font-mono-label font-semibold text-[var(--gf-ink)]">
                {record.manufacturedDate} &rarr; {record.expiryDate}
              </dd>
            </div>
            <div>
              <dt className="font-mono-label uppercase text-[10px] text-[var(--gf-ink-muted)]">
                Evidence Status
              </dt>
              <dd className="mt-0.5 text-[var(--gf-ink)]">{record.coaStatus}</dd>
            </div>
          </dl>

          <div>
            <p className="font-mono-label uppercase text-[10px] text-[var(--gf-ink-muted)]">
              Labelled Active Assay Targets
            </p>
            <ul className="mt-1.5 space-y-1">
              {record.ingredients.map((ing) => (
                <li key={ing.name}>
                  <strong className="font-mono-label">{ing.amountDisplay}</strong>{" "}
                  {ing.name} ({ing.compoundForm})
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-[var(--gf-ink-muted)]">
            <strong>FoSCoS Licence:</strong> {record.fboLicenseStatus} ·{" "}
            <strong>Maker:</strong> {record.manufacturerName}
            {record.canAppearInPublicStore ? (
              <>
                {" "}
                ·{" "}
                <Link
                  href={`/product/${record.productSlug}`}
                  className="font-semibold text-[var(--gf-persimmon-ink)] underline"
                >
                  Open Formulation Page
                </Link>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </section>
  );
}
