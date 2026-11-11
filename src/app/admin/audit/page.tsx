import React from "react";
import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { auditLogs } from "@/db/schema/content";
import { requireAdminPageUser } from "@/domain/auth/rbac";
import { AdminNav } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · RBAC Audit Log",
  robots: { index: false, follow: false },
};

export default async function AdminAuditPage() {
  const actor = await requireAdminPageUser("audit:read");
  const db = await getDb();
  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <AdminNav actor={actor} currentPath="/admin/audit" />

      <div>
        <h1 className="font-display text-3xl text-[var(--gf-ink)]">
          Immutable Staff Audit Trail ({rows.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--gf-ink-muted)]">
          Every product, batch, coupon, order, return, and FSSAI compliance mutation records actor role, entity id, and summary without logging raw customer IP PII.
        </p>
      </div>

      <div
        className="table-scroll-wrap rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)]"
        tabIndex={0}
        role="region"
        aria-label="Admin audit log table"
      >
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="border-b border-[var(--gf-border)] bg-[var(--gf-surface-muted)] font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
            <tr>
              <th className="px-4 py-3">Timestamp (UTC)</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gf-border)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--gf-ink-muted)]">
                  No staff mutations logged yet. Edit a SKU, coupon, or compliance row to generate audit events.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono-label whitespace-nowrap text-[var(--gf-ink-muted)]">
                    {r.createdAt.toISOString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="lilac">{r.actorRole}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono-label font-semibold">
                    {r.action}
                  </td>
                  <td className="px-4 py-3 font-mono-label text-[var(--gf-ink-muted)]">
                    {r.entityType}:{r.entityId}
                  </td>
                  <td className="px-4 py-3">{r.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
