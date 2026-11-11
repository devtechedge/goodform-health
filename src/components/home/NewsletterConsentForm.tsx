"use client";

import React, { useState } from "react";
import { NEWSLETTER_CONSENT_STATEMENT } from "@/domain/email/service";
import { Button } from "@/components/ui/Button";

export function NewsletterConsentForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setStatus("error");
      setMessage("Please tick the explicit consent box before subscribing.");
      return;
    }

    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consentAccepted: consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not subscribe.");
        return;
      }
      setStatus("ok");
      setMessage(data.message);
      setEmail("");
      setConsent(false);
    } catch {
      setStatus("error");
      setMessage("Network error while recording subscription.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.in"
          className="min-h-11 flex-1 min-w-0 rounded-full border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] px-4 text-sm text-[var(--gf-ink)] placeholder:text-[var(--gf-ink-muted)]/70"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={status === "submitting"}
          className="min-h-11"
        >
          {status === "submitting" ? "Saving..." : "Join Dispatch"}
        </Button>
      </div>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--gf-ink-muted)] cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--gf-persimmon)]"
        />
        <span>{NEWSLETTER_CONSENT_STATEMENT}</span>
      </label>

      {message ? (
        <p
          role={status === "error" ? "alert" : "status"}
          className={`text-xs font-medium ${
            status === "error"
              ? "text-[var(--gf-persimmon-ink)]"
              : "text-[var(--gf-verbena-ink)]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
