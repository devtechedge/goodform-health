import React from "react";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { faqs } from "@/db/schema/content";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about GOODFORM's elemental dosing, FSSAI publishing gates, India GST & shipping, Routine Builder, and non-charging demo checkout.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const db = await getDb();
  const items = await db
    .select()
    .from(faqs)
    .where(eq(faqs.isPublished, true))
    .orderBy(asc(faqs.sortOrder));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
      <header className="space-y-3 border-b border-[var(--gf-border)] pb-6">
        <Badge tone="lilac">Dispensary Desk</Badge>
        <h1 className="font-display text-4xl text-[var(--gf-ink)]">
          Frequently Asked Questions
        </h1>
      </header>

      <div className="divide-y divide-[var(--gf-border)] rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] px-6">
        {items.map((item) => (
          <details key={item.id} className="group py-5" open={item.sortOrder <= 2}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-base text-[var(--gf-ink)]">
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className="font-mono-label text-xl text-[var(--gf-persimmon)] transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]">
              {item.category}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
