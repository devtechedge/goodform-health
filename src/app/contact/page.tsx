"use client";

import React, { useState } from "react";
import { BRAND } from "@/lib/brand";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [topic, setTopic] = useState("Quality & Batch Inquiry");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("busy");
    setFeedback(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          name,
          email,
          orderNumber: orderNumber || undefined,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setFeedback(data.error ?? "Unable to submit message.");
        return;
      }
      setStatus("ok");
      setFeedback(`Logged inquiry (${data.referenceId}). A confirmation was written to our email sink.`);
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Network error while sending inquiry.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5 space-y-5">
        <Badge tone="persimmon">Mumbai Care &amp; Quality Desk</Badge>
        <h1 className="font-display text-4xl text-[var(--gf-ink)]">
          Contact &amp; Grievance Redressal
        </h1>
        <p className="text-sm leading-relaxed text-[var(--gf-ink-muted)]">
          Under Indian E-Commerce Consumer Protection Rules, single-brand retail stores maintain a dedicated consumer grievance and batch-quality contact point.
        </p>

        <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 space-y-2 text-xs leading-relaxed text-[var(--gf-ink-muted)]">
          <p>
            <strong className="text-[var(--gf-ink)]">Quality Desk:</strong>{" "}
            {BRAND.qualityEmail}
          </p>
          <p>
            <strong className="text-[var(--gf-ink)]">Grievance Officer:</strong>{" "}
            {BRAND.grievanceEmail}
          </p>
          <p>
            <strong className="text-[var(--gf-ink)]">Support Hours:</strong>{" "}
            Monday to Saturday, 09:30 to 18:30 IST
          </p>
          <p>
            <strong className="text-[var(--gf-ink)]">Address:</strong>{" "}
            {BRAND.registeredAddressDemo}
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="lg:col-span-7 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4"
      >
        <div>
          <label
            htmlFor="contact-topic"
            className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
          >
            Topic
          </label>
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
          >
            <option>Quality &amp; Batch Inquiry</option>
            <option>Order &amp; Shipping Support</option>
            <option>FSSAI / Regulatory Grievance</option>
            <option>General Formulation Question</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contact-name"
              className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
            >
              Your Name
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="contact-email"
              className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
            >
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contact-order"
            className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
          >
            Order Number (Optional)
          </label>
          <input
            id="contact-order"
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="GF-2026-..."
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            rows={4}
            required
            minLength={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3 text-sm"
          />
        </div>

        <Button type="submit" variant="primary" disabled={status === "busy"}>
          {status === "busy" ? "Submitting..." : "Send Message"}
        </Button>

        {feedback ? (
          <p
            role={status === "error" ? "alert" : "status"}
            className={`text-xs font-medium ${
              status === "error"
                ? "text-[var(--gf-persimmon-ink)]"
                : "text-[var(--gf-verbena-ink)]"
            }`}
          >
            {feedback}
          </p>
        ) : null}
      </form>
    </div>
  );
}
