"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function OrderTransitionControl({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState(currentStatus);
  const [msg, setMsg] = useState<string | null>(null);

  const onApply = async () => {
    setMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "transitionOrder",
        orderId,
        nextStatus,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Invalid transition");
      return;
    }
    setMsg("Transitioned");
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <select
        value={nextStatus}
        onChange={(e) => setNextStatus(e.target.value)}
        aria-label="Next order status"
        className="min-h-8 rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2"
      >
        <option value="DEMO_ORDER">DEMO_ORDER</option>
        <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
        <option value="CONFIRMED">CONFIRMED</option>
        <option value="PACKED">PACKED</option>
        <option value="SHIPPED">SHIPPED</option>
        <option value="DELIVERED">DELIVERED</option>
        <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
        <option value="RETURNED">RETURNED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
      <Button variant="outline" size="sm" onClick={() => void onApply()}>
        Update
      </Button>
      {msg ? <span className="text-[var(--gf-ink-muted)]">{msg}</span> : null}
    </div>
  );
}

export function ReturnResolutionControl({
  returnId,
  currentStatus,
}: {
  returnId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const onResolve = async () => {
    setMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resolveReturn",
        returnId,
        nextStatus,
        adminNotes: notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setMsg("Saved");
    router.refresh();
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <select
        value={nextStatus}
        onChange={(e) => setNextStatus(e.target.value)}
        aria-label="Return resolution status"
        className="min-h-8 rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2"
      >
        <option value="REQUESTED">REQUESTED</option>
        <option value="APPROVED">APPROVED</option>
        <option value="REJECTED">REJECTED</option>
        <option value="REFUNDED">REFUNDED</option>
      </select>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Resolution note..."
        aria-label="Resolution note"
        className="min-h-8 rounded-lg border border-[var(--gf-border)] bg-[var(--gf-bg)] px-2.5"
      />
      <Button variant="secondary" size="sm" onClick={() => void onResolve()}>
        Resolve
      </Button>
      {msg ? <span>{msg}</span> : null}
    </div>
  );
}

export function StoreSettingsForm({
  initialThresholdInr,
  initialShippingInr,
  initialAnnouncement,
}: {
  initialThresholdInr: number;
  initialShippingInr: number;
  initialAnnouncement: string;
}) {
  const router = useRouter();
  const [thresholdInr, setThresholdInr] = useState(String(initialThresholdInr));
  const [shippingInr, setShippingInr] = useState(String(initialShippingInr));
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [msg, setMsg] = useState<string | null>(null);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateStoreSettings",
        freeShippingThresholdPaise: Math.round(Number(thresholdInr) * 100),
        standardShippingPaise: Math.round(Number(shippingInr) * 100),
        announcementBarText: announcement,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setMsg("Store shipping & announcement bar saved.");
    router.refresh();
  };

  return (
    <form
      onSubmit={onSave}
      className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4 text-xs"
    >
      <h2 className="font-display text-2xl text-[var(--gf-ink)]">
        Shipping &amp; Storefront Chrome Settings
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ss-thresh" className="block font-mono-label uppercase text-[var(--gf-ink-muted)]">
            Free Shipping Threshold (INR)
          </label>
          <input
            id="ss-thresh"
            type="number"
            min={0}
            value={thresholdInr}
            onChange={(e) => setThresholdInr(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 font-mono-label"
          />
        </div>
        <div>
          <label htmlFor="ss-ship" className="block font-mono-label uppercase text-[var(--gf-ink-muted)]">
            Standard Shipping Below Threshold (INR)
          </label>
          <input
            id="ss-ship"
            type="number"
            min={0}
            value={shippingInr}
            onChange={(e) => setShippingInr(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 font-mono-label"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ss-ann" className="block font-mono-label uppercase text-[var(--gf-ink-muted)]">
          Top Announcement Bar
        </label>
        <input
          id="ss-ann"
          type="text"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="sm">
          Save Store Settings
        </Button>
        {msg ? <span>{msg}</span> : null}
      </div>
    </form>
  );
}

export function FaqContentRowEditor({
  faq,
}: {
  faq: {
    id: string;
    question: string;
    answer: string;
    isPublished: boolean;
  };
}) {
  const router = useRouter();
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [isPublished, setIsPublished] = useState(faq.isPublished);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateFaq",
        faqId: faq.id,
        question,
        answer,
        isPublished,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: data.error ?? "Failed" });
      return;
    }
    setMsg({ ok: true, text: "Saved & audited" });
    router.refresh();
  };

  return (
    <form
      onSubmit={onSave}
      data-testid={`faq-editor-${faq.id}`}
      className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3.5 space-y-2 text-xs"
    >
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        aria-label="FAQ question"
        className="min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2.5 font-semibold"
      />
      <textarea
        rows={2}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        aria-label="FAQ answer"
        className="w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] p-2"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="accent-[var(--gf-persimmon)]"
          />
          <span>Published</span>
        </label>
        <div className="flex items-center gap-2">
          {msg ? (
            <span
              role={msg.ok ? "status" : "alert"}
              className={
                msg.ok
                  ? "text-[var(--gf-verbena-ink)]"
                  : "text-[var(--gf-persimmon-ink)]"
              }
            >
              {msg.text}
            </span>
          ) : null}
          <Button type="submit" variant="outline" size="sm" disabled={busy}>
            Save FAQ
          </Button>
        </div>
      </div>
    </form>
  );
}

export function LearnArticleRowEditor({
  article,
}: {
  article: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    isPublished: boolean;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(article.title);
  const [summary, setSummary] = useState(article.summary);
  const [isPublished, setIsPublished] = useState(article.isPublished);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateLearnArticle",
        articleId: article.id,
        title,
        summary,
        isPublished,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: data.error ?? "Failed" });
      return;
    }
    setMsg({ ok: true, text: "Saved & audited" });
    router.refresh();
  };

  return (
    <form
      onSubmit={onSave}
      className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3.5 space-y-2 text-xs"
    >
      <p className="font-mono-label text-[11px] text-[var(--gf-ink-muted)]">
        /learn/{article.slug}
      </p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Monograph title"
        className="min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2.5 font-semibold"
      />
      <textarea
        rows={2}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        aria-label="Monograph summary"
        className="w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] p-2"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="accent-[var(--gf-persimmon)]"
          />
          <span>Published</span>
        </label>
        <div className="flex items-center gap-2">
          {msg ? (
            <span
              role={msg.ok ? "status" : "alert"}
              className={
                msg.ok
                  ? "text-[var(--gf-verbena-ink)]"
                  : "text-[var(--gf-persimmon-ink)]"
              }
            >
              {msg.text}
            </span>
          ) : null}
          <Button type="submit" variant="outline" size="sm" disabled={busy}>
            Save Monograph
          </Button>
        </div>
      </div>
    </form>
  );
}
