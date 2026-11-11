import React from "react";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  contactInquiries,
  learnArticles,
  newsletterSubscribers,
  storeSettings,
} from "@/db/schema/content";
import { requireAdminPageUser } from "@/domain/auth/rbac";
import { AdminNav } from "@/components/admin/AdminNav";
import { StoreSettingsForm } from "@/components/admin/AdminOpsClient";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Content & Store Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const actor = await requireAdminPageUser("admin:access");
  const db = await getDb();

  const [settingsRows, articles, subscribers, inquiries] = await Promise.all([
    db.select().from(storeSettings).where(eq(storeSettings.id, "default")),
    db.select().from(learnArticles),
    db.select().from(newsletterSubscribers),
    db
      .select()
      .from(contactInquiries)
      .orderBy(desc(contactInquiries.createdAt))
      .limit(10),
  ]);

  const s = settingsRows[0];
  const activeSubs = subscribers.filter((x) => x.status === "ACTIVE").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <AdminNav actor={actor} currentPath="/admin/settings" />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <StoreSettingsForm
            initialThresholdInr={(s?.freeShippingThresholdPaise ?? 99900) / 100}
            initialShippingInr={(s?.standardShippingPaise ?? 7900) / 100}
            initialAnnouncement={s?.announcementBarText ?? ""}
          />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-3">
            <h2 className="font-display text-2xl text-[var(--gf-ink)]">
              Editorial &amp; Consent Summary
            </h2>
            <p className="text-xs text-[var(--gf-ink-muted)]">
              Published <code className="font-mono-label">/learn</code> monographs:{" "}
              <strong>{articles.length}</strong> · Active consent-verified newsletter subscribers:{" "}
              <strong>{activeSubs}</strong> ({subscribers.length} total records).
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-3">
            <h2 className="font-display text-2xl text-[var(--gf-ink)]">
              Recent Quality &amp; Grievance Inquiries ({inquiries.length})
            </h2>
            {inquiries.length === 0 ? (
              <p className="text-xs text-[var(--gf-ink-muted)]">
                No inquiries submitted yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--gf-border)] text-xs">
                {inquiries.map((inq) => (
                  <li key={inq.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong>{inq.topic}</strong>
                      <Badge tone="neutral">{inq.status}</Badge>
                    </div>
                    <p className="text-[var(--gf-ink-muted)]">
                      {inq.name} ({inq.email}) · {inq.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
