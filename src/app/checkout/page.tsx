import React from "react";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { addresses } from "@/db/schema/users";
import { getCurrentUser } from "@/domain/auth/rbac";
import { getAvailablePaymentProviders } from "@/env";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const db = await getDb();
  const savedAddresses = user
    ? await db.select().from(addresses).where(eq(addresses.userId, user.id))
    : [];

  const availableProviders = getAvailablePaymentProviders();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--gf-ink)]">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-[var(--gf-ink-muted)]">
          Server-verified INR paise pricing, atomic batch stock reservation, and intra/inter-state GST calculation.
        </p>
      </div>

      <CheckoutClient
        initialUser={
          user
            ? { fullName: user.fullName, email: user.email, phone: user.phone }
            : null
        }
        savedAddresses={savedAddresses}
        availableProviders={availableProviders}
      />
    </div>
  );
}
