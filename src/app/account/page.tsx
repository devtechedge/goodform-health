import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { emailOutbox } from "@/db/schema/content";
import { addresses, savedRoutines } from "@/db/schema/users";
import { requirePageUser, roleHasPermission } from "@/domain/auth/rbac";
import { listUserOrders } from "@/domain/orders/service";
import { formatInrPaise } from "@/lib/india";
import {
  AddressBookManager,
  ReorderButton,
  SignOutButton,
} from "@/components/account/AccountActionsClient";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

interface AccountPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await requirePageUser("/account");
  const sp = await searchParams;
  const deniedAdmin = sp.denied === "admin";

  const db = await getDb();
  const [userOrders, userAddresses, routines, recentEmails] = await Promise.all([
    listUserOrders(user.id, db),
    db.select().from(addresses).where(eq(addresses.userId, user.id)),
    db
      .select()
      .from(savedRoutines)
      .where(eq(savedRoutines.userId, user.id))
      .orderBy(desc(savedRoutines.createdAt)),
    db
      .select()
      .from(emailOutbox)
      .where(eq(emailOutbox.toEmail, user.email.toLowerCase()))
      .orderBy(desc(emailOutbox.createdAt))
      .limit(5),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {deniedAdmin ? (
        <Callout tone="persimmon" title="Admin Role Required">
          Your account ({user.role}) does not hold staff access to <code className="font-mono-label">/admin</code>.
        </Callout>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--gf-border)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="lilac">{user.role}</Badge>
            {user.isDemoAccount ? <Badge tone="amber">Demo Account</Badge> : null}
          </div>
          <h1 className="mt-2 font-display text-4xl text-[var(--gf-ink)]">
            {user.fullName}
          </h1>
          <p className="text-sm text-[var(--gf-ink-muted)]">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {roleHasPermission(user.role, "admin:access") ? (
            <Link
              href="/admin"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Open Admin Console
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </header>

      {/* Orders & Reorder */}
      <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4">
        <h2 className="font-display text-2xl text-[var(--gf-ink)]">
          Orders &amp; Reorder ({userOrders.length})
        </h2>

        {userOrders.length === 0 ? (
          <p className="text-sm text-[var(--gf-ink-muted)]">
            No orders yet. Visit <Link href="/shop" className="underline">the dispensary</Link> to place an order.
          </p>
        ) : (
          <div className="space-y-4">
            {userOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/account/orders/${ord.id}`}
                      className="font-mono-label text-sm font-semibold hover:text-[var(--gf-persimmon)] underline"
                    >
                      {ord.orderNumber}
                    </Link>
                    <Badge tone={ord.isDemoOrder ? "amber" : "verbena"}>
                      {ord.orderStatus}
                    </Badge>
                    <Badge tone="neutral">Payment: {ord.paymentStatus}</Badge>
                  </div>
                  <p className="text-xs text-[var(--gf-ink-muted)]">
                    {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono-label text-base font-semibold">
                    {formatInrPaise(ord.totalPaise)}
                  </span>
                  <Link
                    href={`/account/orders/${ord.id}`}
                    className={buttonClasses({ variant: "outline", size: "sm" })}
                  >
                    Invoice &amp; Returns
                  </Link>
                  <ReorderButton orderId={ord.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Saved Routines */}
        <section className="lg:col-span-5 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            Saved Routines ({routines.length})
          </h2>
          {routines.length === 0 ? (
            <p className="text-sm text-[var(--gf-ink-muted)]">
              Save a stack in the{" "}
              <Link href="/routine-builder" className="underline">
                Routine Builder
              </Link>{" "}
              to keep it here.
            </p>
          ) : (
            <ul className="space-y-3">
              {routines.map((rtn) => (
                <li
                  key={rtn.id}
                  className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3.5 text-xs space-y-1.5"
                >
                  <p className="font-semibold text-sm text-[var(--gf-ink)]">
                    {rtn.title}
                  </p>
                  <p className="font-mono-label text-[var(--gf-ink-muted)]">
                    {rtn.productSlugsJson.join(", ")}
                  </p>
                  <Link
                    href={`/routine-builder?items=${encodeURIComponent(
                      rtn.productSlugsJson.join(","),
                    )}`}
                    className="inline-block font-semibold text-[var(--gf-persimmon-ink)] hover:underline"
                  >
                    Open in Routine Builder &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Indian Delivery Addresses */}
        <section className="lg:col-span-7 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            Saved Indian Addresses
          </h2>
          <AddressBookManager addresses={userAddresses} />
        </section>
      </div>

      {/* Email Sink Viewer for verification */}
      {recentEmails.length > 0 ? (
        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-3">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            Recent Transactional Dispatches (Email Outbox Sink)
          </h2>
          <ul className="divide-y divide-[var(--gf-border)] text-xs">
            {recentEmails.map((em) => (
              <li key={em.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                <span>
                  <strong>{em.subject}</strong> ({em.transportMode})
                </span>
                <span className="font-mono-label text-[var(--gf-ink-muted)]">
                  {em.templateKey}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
