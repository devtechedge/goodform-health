import type { MetadataRoute } from "next";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { learnArticles } from "@/db/schema/content";
import { listPublicCatalog } from "@/domain/catalog/service";
import { getSiteUrl } from "@/env";
import { COLLECTIONS } from "@/lib/collections";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const db = await getDb();

  const [catalog, articles] = await Promise.all([
    listPublicCatalog({ pageSize: 48 }, db),
    db
      .select()
      .from(learnArticles)
      .where(eq(learnArticles.isPublished, true))
      .orderBy(asc(learnArticles.sortOrder)),
  ]);

  const staticPaths = [
    "",
    "/shop",
    "/routine-builder",
    "/learn",
    "/about",
    "/quality",
    "/faq",
    "/contact",
    "/shipping",
    "/returns",
    "/privacy",
    "/terms",
    "/disclaimer",
  ];

  const now = new Date();

  return [
    ...staticPaths.map((p) => ({
      url: `${siteUrl}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1.0 : 0.8,
    })),
    ...COLLECTIONS.map((c) => ({
      url: `${siteUrl}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...catalog.items.map((prod) => ({
      url: `${siteUrl}/product/${prod.slug}`,
      lastModified: prod.updatedAt,
      changeFrequency: "weekly" as const,
      priority: prod.isFlagship ? 0.95 : 0.75,
    })),
    ...articles.map((art) => ({
      url: `${siteUrl}/learn/${art.slug}`,
      lastModified: art.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
