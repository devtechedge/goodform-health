"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Copy, Save, ShoppingBag, Sparkles } from "lucide-react";
import {
  analyzeRoutineSelection,
  recommendRoutineProducts,
  type RoutineCandidateProduct,
  type RoutineDietPreference,
  type RoutineFocusTag,
  type RoutineFormatPreference,
} from "@/domain/routine/overlap";
import { formatInrPaise } from "@/lib/india";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { useCart } from "@/components/cart/CartContext";

const FOCUS_OPTIONS: Array<{ tag: RoutineFocusTag; label: string }> = [
  { tag: "morning-foundations", label: "Morning Foundations" },
  { tag: "indoor-daylight", label: "Indoor Workday (D3/B12)" },
  { tag: "training-hydration", label: "Training & Hydration" },
  { tag: "evening-wind-down", label: "Evening Wind-Down" },
  { tag: "gut-comfort", label: "Gut & Fibre" },
  { tag: "beauty-structure", label: "Collagen & Biotin" },
  { tag: "antioxidant-support", label: "Antioxidant Support" },
];

export interface RoutineBuilderClientProps {
  catalog: RoutineCandidateProduct[];
  initialSlugs: string[];
  initialDiet?: RoutineDietPreference;
}

export function RoutineBuilderClient({
  catalog,
  initialSlugs,
  initialDiet = "VEGETARIAN",
}: RoutineBuilderClientProps) {
  const { addBatchToCart, isBusy } = useCart();
  const [diet, setDiet] = useState<RoutineDietPreference>(initialDiet);
  const [format, setFormat] = useState<RoutineFormatPreference>("EITHER");
  const [focusAreas, setFocusAreas] = useState<RoutineFocusTag[]>([
    "morning-foundations",
    "indoor-daylight",
  ]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (initialSlugs.length > 0) return initialSlugs;
    return recommendRoutineProducts(catalog, {
      diet: initialDiet,
      format: "EITHER",
      focusAreas: ["morning-foundations", "indoor-daylight"],
    }).map((p) => p.slug);
  });

  const [routineTitle, setRoutineTitle] = useState("My Everyday Stack");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedProducts = useMemo(
    () =>
      selectedSlugs
        .map((s) => catalog.find((p) => p.slug === s))
        .filter((p): p is RoutineCandidateProduct => Boolean(p)),
    [catalog, selectedSlugs],
  );

  const analysis = useMemo(
    () => analyzeRoutineSelection(selectedProducts),
    [selectedProducts],
  );

  const visibleCatalog = useMemo(() => {
    return catalog.filter((p) => {
      if (diet === "VEGAN" && p.dietType !== "VEGAN") return false;
      if (diet === "VEGETARIAN" && p.dietType === "NON_VEGETARIAN") return false;
      return true;
    });
  }, [catalog, diet]);

  const toggleFocus = (tag: RoutineFocusTag) => {
    setFocusAreas((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const applyRecommendation = () => {
    const rec = recommendRoutineProducts(catalog, {
      diet,
      format,
      focusAreas,
    });
    setSelectedSlugs(rec.map((p) => p.slug));
    setSaveMessage(null);
  };

  const toggleProduct = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug].slice(0, 8),
    );
  };

  const handleShareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("items", selectedSlugs.join(","));
    url.searchParams.set("diet", diet);
    window.history.replaceState(null, "", url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  const handleSaveRoutine = async () => {
    setSaveMessage(null);
    const res = await fetch("/api/account/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: routineTitle,
        preferences: { diet, format, focusAreas },
        productSlugs: selectedSlugs,
      }),
    });
    const data = await res.json();
    if (res.status === 401) {
      setSaveMessage("Sign in required to save routines to your account.");
      return;
    }
    if (!res.ok) {
      setSaveMessage(data.error ?? "Could not save routine.");
      return;
    }
    setSaveMessage("Saved to your account under Saved Routines.");
  };

  const handleAddStackToBag = async () => {
    if (selectedProducts.length === 0) return;
    await addBatchToCart(
      selectedProducts.map((p) => ({
        variantId: p.defaultVariantId,
        quantity: 1,
      })),
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left Planner Column */}
      <div className="lg:col-span-7 space-y-6 min-w-0">
        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl text-[var(--gf-ink)]">
              1. Everyday Preferences (Non-Diagnostic)
            </h2>
            <Badge tone="lilac">No medical profiling</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="rb-diet"
                className="block font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]"
              >
                Dietary Pattern
              </label>
              <select
                id="rb-diet"
                value={diet}
                onChange={(e) => setDiet(e.target.value as RoutineDietPreference)}
                className="mt-1.5 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
              >
                <option value="VEGETARIAN">Vegetarian (Includes Dairy)</option>
                <option value="VEGAN">100% Plant-Origin (Vegan)</option>
                <option value="OMNIVORE">Omnivore (Includes Fish/Bovine)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="rb-format"
                className="block font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]"
              >
                Format Preference
              </label>
              <select
                id="rb-format"
                value={format}
                onChange={(e) =>
                  setFormat(e.target.value as RoutineFormatPreference)
                }
                className="mt-1.5 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
              >
                <option value="EITHER">Capsules, Softgels &amp; Powders</option>
                <option value="CAPSULES_SOFTGELS">Capsules &amp; Softgels Only</option>
                <option value="POWDERS_SACHETS">Powders &amp; Sachets Only</option>
              </select>
            </div>
          </div>

          <div>
            <p className="font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]">
              Daily Routine Focus
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((opt) => {
                const active = focusAreas.includes(opt.tag);
                return (
                  <button
                    key={opt.tag}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleFocus(opt.tag)}
                    className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[var(--gf-aubergine)] text-[var(--gf-on-aubergine)]"
                        : "border border-[var(--gf-border)] bg-[var(--gf-bg)] text-[var(--gf-ink)] hover:bg-[var(--gf-surface-muted)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={applyRecommendation}
            data-testid="routine-suggest-btn"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Suggest Balanced Starter Stack</span>
          </Button>
        </section>

        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 sm:p-6 space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl text-[var(--gf-ink)]">
              2. Toggle Formulations ({visibleCatalog.length} compatible)
            </h2>
            <span className="font-mono-label text-xs text-[var(--gf-ink-muted)]">
              Up to 8 jars
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleCatalog.map((prod) => {
              const checked = selectedSlugs.includes(prod.slug);
              return (
                <button
                  key={prod.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  data-testid={`routine-toggle-${prod.slug}`}
                  onClick={() => toggleProduct(prod.slug)}
                  className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                    checked
                      ? "border-[var(--gf-persimmon)] bg-[var(--gf-persimmon-soft)]/50"
                      : "border-[var(--gf-border)] bg-[var(--gf-bg)] hover:border-[var(--gf-border-strong)]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[var(--gf-ink)]">
                      {prod.name}
                    </p>
                    <p className="mt-0.5 font-mono-label text-xs text-[var(--gf-ink-muted)]">
                      {formatInrPaise(prod.startingPricePaise)} · {prod.servingsPerPack}d
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      checked
                        ? "border-[var(--gf-persimmon)] bg-[var(--gf-persimmon)] text-[var(--gf-on-persimmon)]"
                        : "border-[var(--gf-border-strong)] bg-[var(--gf-surface)]"
                    }`}
                  >
                    {checked ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Right Overlap & Totals Column */}
      <div className="lg:col-span-5 space-y-5 min-w-0">
        <div className="rounded-3xl border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-5 sm:p-6 space-y-5">
          <div className="flex items-baseline justify-between gap-3 border-b border-[var(--gf-border)] pb-4">
            <div>
              <p className="font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]">
                Selected Routine ({selectedProducts.length})
              </p>
              <p
                data-testid="routine-total-price"
                className="mt-1 font-mono-label text-3xl font-semibold text-[var(--gf-ink)]"
              >
                {formatInrPaise(analysis.totalPackPricePaise)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono-label text-sm font-semibold text-[var(--gf-persimmon-ink)]">
                ~{formatInrPaise(analysis.estimatedDailyCostPaise)} / day
              </p>
              <p className="text-[11px] text-[var(--gf-ink-muted)]">
                Estimated per-serving daily sum
              </p>
            </div>
          </div>

          {selectedProducts.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {selectedProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[var(--gf-bg)] px-3 py-2"
                >
                  <Link
                    href={`/product/${p.slug}`}
                    className="font-medium hover:text-[var(--gf-persimmon)] truncate"
                  >
                    {p.name}
                  </Link>
                  <span className="font-mono-label text-xs shrink-0">
                    {formatInrPaise(p.startingPricePaise)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--gf-ink-muted)]">
              Select at least one formulation on the left to inspect cumulative intake and overlap cautions.
            </p>
          )}

          {/* Overlap & Upper-Limit Cautions */}
          <div className="space-y-3" data-testid="routine-cautions-region">
            <h3 className="font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]">
              Nutrient Overlap &amp; ICMR-NIN Check ({analysis.cautions.length})
            </h3>

            {analysis.cautions.length === 0 ? (
              <Callout tone="verified" title="Zero Overlapping Micronutrient Warnings">
                None of your selected jars duplicate tracked vitamins/minerals or exceed single-supplement ICMR-NIN daily reference thresholds.
              </Callout>
            ) : (
              analysis.cautions.map((c) => (
                <div
                  key={`${c.key}-${c.severity}`}
                  className={`rounded-2xl border p-3.5 text-xs leading-relaxed ${
                    c.severity === "EXCEEDS_DAILY_REFERENCE"
                      ? "border-[var(--gf-amber-border)] bg-[var(--gf-amber-soft)] text-[var(--gf-amber-ink)]"
                      : "border-[var(--gf-lilac-border)] bg-[var(--gf-lilac)] text-[var(--gf-lilac-ink)]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {c.nutrientLabel}: {c.totalAmount} {c.unit}
                      {c.referenceThreshold
                        ? ` (Ref: ${c.referenceThreshold} ${c.unit})`
                        : ""}
                    </span>
                  </div>
                  <p className="mt-1">
                    <strong>Sources:</strong>{" "}
                    {c.contributors
                      .map((item) => `${item.name} (${item.amount} ${c.unit})`)
                      .join(" + ")}
                  </p>
                  <p className="mt-1 opacity-95">{c.guidance}</p>
                </div>
              ))
            )}
          </div>

          {analysis.nutrientTotals.length > 0 ? (
            <div className="border-t border-[var(--gf-border)] pt-4">
              <h3 className="font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)] mb-2">
                Combined Daily Elemental Sums
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                {analysis.nutrientTotals.map((nt) => (
                  <div
                    key={nt.key}
                    className="rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2.5 py-2"
                  >
                    <dt className="truncate text-[var(--gf-ink-muted)]">
                      {nt.label}
                    </dt>
                    <dd className="font-mono-label font-semibold text-[var(--gf-ink)]">
                      {nt.total} {nt.unit}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="space-y-2.5 border-t border-[var(--gf-border)] pt-4">
            <Button
              variant="primary"
              size="lg"
              disabled={selectedProducts.length === 0 || isBusy}
              onClick={() => void handleAddStackToBag()}
              data-testid="routine-add-all"
              className="w-full"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>Add All {selectedProducts.length} to Bag</span>
            </Button>

            <div className="flex gap-2">
              <label htmlFor="routine-title-input" className="sr-only">
                Routine title
              </label>
              <input
                id="routine-title-input"
                type="text"
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                className="min-h-10 flex-1 min-w-0 rounded-full border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={selectedProducts.length === 0}
                onClick={() => void handleSaveRoutine()}
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedProducts.length === 0}
                onClick={() => void handleShareLink()}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copied ? "Copied" : "Share"}</span>
              </Button>
            </div>

            {saveMessage ? (
              <p className="text-xs text-[var(--gf-ink-muted)]">
                {saveMessage}{" "}
                {saveMessage.includes("Sign in") ? (
                  <Link href="/login?next=/routine-builder" className="font-semibold text-[var(--gf-persimmon-ink)] underline">
                    Sign in
                  </Link>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[var(--gf-ink-muted)]">
          <strong>Non-Medical Notice:</strong> This planner checks ingredient arithmetic and format compatibility only. It does not diagnose nutrient deficiencies or replace clinical blood testing and medical advice.
        </p>
      </div>
    </div>
  );
}
