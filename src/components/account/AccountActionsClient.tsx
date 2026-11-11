"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RotateCcw, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { INDIAN_STATES } from "@/lib/india";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshCart();
    router.push("/login");
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      data-testid="account-signout-btn"
      onClick={() => void handleLogout()}
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{busy ? "Signing Out..." : "Sign Out"}</span>
    </Button>
  );
}

export function ReorderButton({ orderId }: { orderId: string }) {
  const { refreshCart, openDrawer } = useCart();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const onReorder = async () => {
    setBusy(true);
    setNote(null);
    const res = await fetch(`/api/account/orders/${orderId}/reorder`, {
      method: "POST",
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(data.error ?? "Could not reorder.");
      return;
    }
    await refreshCart();
    openDrawer();
    if (data.skippedItems?.length > 0) {
      setNote(`Skipped: ${data.skippedItems.join(", ")}`);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        data-testid={`reorder-btn-${orderId}`}
        onClick={() => void onReorder()}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{busy ? "Adding..." : "Reorder Stack"}</span>
      </Button>
      {note ? <span className="text-[11px] text-[var(--gf-amber-ink)]">{note}</span> : null}
    </div>
  );
}

export function DeleteRoutineButton({
  routineId,
  routineTitle,
}: {
  routineId: string;
  routineTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    setBusy(true);
    await fetch(`/api/account/routines?id=${encodeURIComponent(routineId)}`, {
      method: "DELETE",
    });
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      type="button"
      disabled={busy}
      aria-label={`Delete saved routine ${routineTitle}`}
      data-testid={`delete-routine-${routineId}`}
      onClick={() => void onDelete()}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--gf-ink-muted)] hover:bg-[var(--gf-surface-muted)]"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("Damaged transit seal");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/account/orders/${orderId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Unable to request return.");
      return;
    }
    setMsg("Return request submitted.");
    setDetails("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-4">
      <h3 className="font-semibold text-sm">Request Return / Batch Replacement</h3>
      <div>
        <label htmlFor="ret-reason" className="block font-mono-label text-xs text-[var(--gf-ink-muted)]">
          Reason
        </label>
        <select
          id="ret-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-surface)] px-3 text-sm"
        >
          <option>Damaged transit seal</option>
          <option>Incorrect pack variant received</option>
          <option>Unopened 14-day sealed return</option>
        </select>
      </div>
      <div>
        <label htmlFor="ret-details" className="block font-mono-label text-xs text-[var(--gf-ink-muted)]">
          Details (Batch condition)
        </label>
        <textarea
          id="ret-details"
          rows={2}
          required
          minLength={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe package seal condition..."
          className="mt-1 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-2.5 text-sm"
        />
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={busy}>
        {busy ? "Submitting..." : "Submit Return Request"}
      </Button>
      {msg ? <p className="text-xs font-medium text-[var(--gf-ink-muted)]">{msg}</p> : null}
    </form>
  );
}

export function AddressBookManager({
  addresses,
}: {
  addresses: Array<{
    id: string;
    label: string;
    recipientName: string;
    phone: string;
    line1: string;
    city: string;
    stateCode: string;
    pinCode: string;
  }>;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("Home");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("MH");
  const [pinCode, setPinCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        recipientName,
        phone,
        line1,
        city,
        stateCode,
        pinCode,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Invalid address.");
      return;
    }
    setRecipientName("");
    setPhone("");
    setLine1("");
    setCity("");
    setPinCode("");
    setMsg("Saved Indian delivery address.");
    router.refresh();
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-2 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3.5 text-xs"
          >
            <div>
              <p className="font-semibold text-sm text-[var(--gf-ink)]">
                {a.label} · {a.recipientName}
              </p>
              <p className="mt-0.5 text-[var(--gf-ink-muted)]">
                {a.line1}, {a.city} {a.pinCode} ({a.stateCode})
              </p>
              <p className="font-mono-label mt-0.5 text-[var(--gf-ink-muted)]">
                {a.phone}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Delete address ${a.label}`}
              onClick={() => void onDelete(a.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--gf-surface-muted)]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={onAdd} className="grid gap-3 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-4 sm:grid-cols-3">
        <div>
          <label htmlFor="addr-label" className="block font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
            Label
          </label>
          <input
            id="addr-label"
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="addr-recipient" className="block font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
            Recipient
          </label>
          <input
            id="addr-recipient"
            type="text"
            required
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="addr-phone" className="block font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
            Mobile
          </label>
          <input
            id="addr-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9820144110"
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2.5 text-xs"
          />
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="addr-line1" className="block font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
            Street Address
          </label>
          <input
            id="addr-line1"
            type="text"
            required
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="addr-city" className="block font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
            City
          </label>
          <input
            id="addr-city"
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="addr-state" className="block font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
            State
          </label>
          <select
            id="addr-state"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2 text-xs"
          >
            {INDIAN_STATES.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="addr-pin" className="block font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
            PIN Code
          </label>
          <input
            id="addr-pin"
            type="text"
            maxLength={6}
            required
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1 min-h-9 w-full rounded-lg border border-[var(--gf-border)] bg-[var(--gf-surface)] px-2.5 font-mono-label text-xs"
          />
        </div>
        <div className="sm:col-span-3 flex items-center justify-between">
          <Button type="submit" variant="outline" size="sm">
            Add Address
          </Button>
          {msg ? <span className="text-xs text-[var(--gf-ink-muted)]">{msg}</span> : null}
        </div>
      </form>
    </div>
  );
}
