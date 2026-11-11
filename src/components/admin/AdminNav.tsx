import React from "react";
import Link from "next/link";
import type { AuthenticatedUser } from "@/domain/auth/session";
import { Badge } from "@/components/ui/Badge";

const ADMIN_TABS = [
  { href: "/admin", label: "Overview & Reports" },
  { href: "/admin/products", label: "40 SKUs, Prices & Batches" },
  { href: "/admin/compliance", label: "FSSAI Gate" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/orders", label: "Orders & Returns" },
  { href: "/admin/settings", label: "Content & Shipping" },
  { href: "/admin/audit", label: "Audit Log" },
] as const;

export function AdminNav({
  actor,
  currentPath,
}: {
  actor: AuthenticatedUser;
  currentPath: string;
}) {
  return (
    <div className="mb-8 rounded-3xl border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="persimmon">Staff Console</Badge>
            <Badge tone="lilac">{actor.role}</Badge>
          </div>
          <p className="mt-1 text-sm font-semibold text-[var(--gf-ink)]">
            Signed in as {actor.fullName} ({actor.email})
          </p>
        </div>
        <Link
          href="/account"
          className="font-mono-label text-xs text-[var(--gf-persimmon-ink)] hover:underline"
        >
          Customer Account View &rarr;
        </Link>
      </div>

      <nav
        aria-label="Admin sections"
        className="flex flex-wrap gap-2 border-t border-[var(--gf-border)] pt-3.5"
      >
        {ADMIN_TABS.map((tab) => {
          const active = tab.href === currentPath;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-[var(--gf-aubergine)] text-[var(--gf-on-aubergine)]"
                  : "border border-[var(--gf-border)] bg-[var(--gf-bg)] text-[var(--gf-ink)] hover:bg-[var(--gf-surface-muted)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
