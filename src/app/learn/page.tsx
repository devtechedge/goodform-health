import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowRight, BookOpen } from "lucide-react";
import { getDb } from "@/db/client";
import { learnArticles } from "@/db/schema/content";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learn · Sourced Nutrition & Label Guides",
  description:
    "Primary-sourced guides on elemental mineral stoichiometry, urban Indian Vitamin D & B12 context, algal vs marine omega-3s, and FSSAI governance.",
  alternates: { canonical: "/learn" },
};

export default async function LearnIndexPage() {
  const db = await getDb();
  const articles = await db
    .select()
    .from(learnArticles)
    .where(eq(learnArticles.isPublished, true))
    .orderBy(asc(learnArticles.sortOrder));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-3 border-b border-[var(--gf-border)] pb-8">
        <Badge tone="lilac">Sourced Reference Desk</Badge>
        <h1 className="font-display text-4xl text-[var(--gf-ink)] sm:text-5xl">
          Read the chemistry &amp; primary sources before the jar
        </h1>
        <p className="text-base leading-relaxed text-[var(--gf-ink-muted)]">
          Every GOODFORM guide cites primary regulatory texts, public health surveys, or peer-reviewed position stands. Educational reading only; never medical advice.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {articles.map((article, idx) => (
          <article
            key={article.id}
            className={`flex flex-col justify-between rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 ${
              idx === 0 ? "md:col-span-2" : ""
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono-label text-[var(--gf-ink-muted)]">
                <span className="uppercase tracking-wider">
                  {article.category}
                </span>
                <span>{article.readingMinutes} min read</span>
              </div>

              <h2 className="mt-3 font-display text-2xl text-[var(--gf-ink)] sm:text-3xl">
                <Link
                  href={`/learn/${article.slug}`}
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  {article.title}
                </Link>
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
                {article.summary}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[var(--gf-border)] pt-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[var(--gf-ink-muted)]">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{article.referencesJson.length} cited source(s)</span>
              </span>
              <Link
                href={`/learn/${article.slug}`}
                className="inline-flex items-center gap-1 font-semibold text-[var(--gf-persimmon-ink)] hover:underline"
              >
                <span>Read Monograph</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
