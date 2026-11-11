import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { getDb } from "@/db/client";
import { learnArticles } from "@/db/schema/content";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";

export const dynamic = "force-dynamic";

interface LearnArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LearnArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDb();
  const [article] = await db
    .select()
    .from(learnArticles)
    .where(and(eq(learnArticles.slug, slug), eq(learnArticles.isPublished, true)));

  if (!article) return { title: "Guide Not Found" };
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/learn/${article.slug}` },
  };
}

export default async function LearnArticlePage({
  params,
}: LearnArticlePageProps) {
  const { slug } = await params;
  const db = await getDb();
  const [article] = await db
    .select()
    .from(learnArticles)
    .where(and(eq(learnArticles.slug, slug), eq(learnArticles.isPublished, true)));

  if (!article) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/learn"
        className="font-mono-label text-xs text-[var(--gf-persimmon-ink)] hover:underline"
      >
        &larr; All Monographs
      </Link>

      <header className="mt-4 space-y-3 border-b border-[var(--gf-border)] pb-8">
        <div className="flex items-center gap-2">
          <Badge tone="lilac">{article.category}</Badge>
          <span className="font-mono-label text-xs text-[var(--gf-ink-muted)]">
            {article.readingMinutes} min read
          </span>
        </div>
        <h1 className="font-display text-3xl text-[var(--gf-ink)] sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-base leading-relaxed text-[var(--gf-ink-muted)]">
          {article.summary}
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {article.sectionsJson.map((sec) => (
          <section key={sec.heading} className="space-y-3">
            <h2 className="font-display text-2xl text-[var(--gf-ink)]">
              {sec.heading}
            </h2>
            {sec.paragraphs.map((para, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-[var(--gf-ink)] sm:text-base"
              >
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6">
        <h2 className="font-mono-label text-xs uppercase tracking-[0.15em] text-[var(--gf-ink-muted)]">
          Primary Sources &amp; Citations
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm">
          {article.referencesJson.map((ref) => (
            <li key={ref.url}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[var(--gf-persimmon-ink)] hover:underline"
              >
                <span>{ref.title}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
              <span className="block text-xs text-[var(--gf-ink-muted)]">
                {ref.publisher}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Callout
        tone="caution"
        title="Educational Information Only"
        className="mt-8"
      >
        This monograph summarizes nutrition chemistry and regulatory structure for general literacy. It does not diagnose, treat, cure, or prevent any medical condition.
      </Callout>
    </article>
  );
}
