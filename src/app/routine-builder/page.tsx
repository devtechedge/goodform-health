import React from "react";
import type { Metadata } from "next";
import { listPublicCatalog } from "@/domain/catalog/service";
import {
  parseShareableRoutineSlugs,
  type RoutineCandidateProduct,
  type RoutineDietPreference,
} from "@/domain/routine/overlap";
import { RoutineBuilderClient } from "@/components/routine/RoutineBuilderClient";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Routine Builder & Overlap Checker",
  description:
    "Build an everyday non-diagnostic supplement routine, inspect cumulative elemental milligrams, spot ICMR-NIN nutrient overlaps, and save or share your stack.",
  alternates: { canonical: "/routine-builder" },
};

interface RoutineBuilderPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RoutineBuilderPage({
  searchParams,
}: RoutineBuilderPageProps) {
  const sp = await searchParams;
  const rawItems = Array.isArray(sp.items) ? sp.items[0] : sp.items;
  const rawDiet = Array.isArray(sp.diet) ? sp.diet[0] : sp.diet;

  const catalogResult = await listPublicCatalog({ pageSize: 48 });
  const candidates: RoutineCandidateProduct[] = catalogResult.items.map(
    (p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      supplementForm: p.supplementForm,
      dietType: p.dietType,
      routineTags: p.routineTags,
      servingsPerPack: p.servingsPerPack,
      startingPricePaise: p.startingPricePaise,
      defaultVariantId: p.defaultVariant.id,
      ingredientsJson: p.ingredientsJson,
    }),
  );

  const allowedSet = new Set(candidates.map((c) => c.slug));
  const initialSlugs = parseShareableRoutineSlugs(rawItems, allowedSet);
  const initialDiet: RoutineDietPreference =
    rawDiet === "VEGAN" || rawDiet === "OMNIVORE" ? rawDiet : "VEGETARIAN";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl space-y-2">
        <Badge tone="persimmon">Interactive Stack Planner</Badge>
        <h1 className="font-display text-4xl text-[var(--gf-ink)] sm:text-5xl">
          Build a daily routine with zero hidden overlap
        </h1>
        <p className="text-sm leading-relaxed text-[var(--gf-ink-muted)] sm:text-base">
          Choose your dietary pattern and daily focus, toggle formulations, and check cumulative elemental intake against Indian ICMR-NIN daily reference allowances before adding to your bag.
        </p>
      </div>

      <RoutineBuilderClient
        catalog={candidates}
        initialSlugs={initialSlugs}
        initialDiet={initialDiet}
      />
    </div>
  );
}
