import React from "react";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "How GOODFORM handles account, order, and newsletter consent data under India's Digital Personal Data Protection (DPDP) principles.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <Badge tone="lilac">DPDP Act 2023 Aligned</Badge>
      <h1 className="font-display text-4xl text-[var(--gf-ink)]">
        Privacy Notice
      </h1>
      <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
        <p>
          <strong className="text-[var(--gf-ink)]">Minimal Collection:</strong> GOODFORM stores only the account profile, Indian delivery address, order history, and explicit newsletter consent records needed to operate the store. Please do not enter real medical records or sensitive personal data into this public demo environment.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Zero Payment Card Storage:</strong> Card, UPI, and netbanking credentials never touch GOODFORM servers. Live payments delegate to Razorpay India or Stripe hosted/SDK surfaces, and non-charging demo checkout collects zero payment instrument numbers.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Cookies &amp; Rate Limiting:</strong> Session and guest-bag cookies are <code className="font-mono-label">httpOnly</code> and <code className="font-mono-label">SameSite=Lax</code>. Rate-limit buckets store HMAC hashes rather than raw client IP addresses.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Consent &amp; Erasure Contact:</strong> Every newsletter subscription logs explicit opt-in consent and includes a one-click unsubscribe token. Data inquiries may be sent to {BRAND.grievanceEmail}.
        </p>
      </div>
    </div>
  );
}
