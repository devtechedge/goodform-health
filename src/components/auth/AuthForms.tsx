"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

export interface LoginFormProps {
  nextUrl: string;
  demoAccountsEnabled: boolean;
}

export function LoginForm({ nextUrl, demoAccountsEnabled }: LoginFormProps) {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNext = nextUrl.startsWith("/") && !nextUrl.startsWith("//")
    ? nextUrl
    : "/account";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed.");
        return;
      }
      await refreshCart();
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("Network error while signing in.");
    } finally {
      setBusy(false);
    }
  };

  const loginDemo = async (
    persona: "customer" | "merchandiser" | "compliance" | "admin",
  ) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Demo login unavailable.");
        return;
      }
      await refreshCart();
      router.push(persona === "customer" ? safeNext : "/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4"
      >
        <div>
          <label
            htmlFor="login-email"
            className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 text-sm"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-[var(--gf-persimmon)]/40 bg-[var(--gf-persimmon-soft)] p-3 text-xs font-medium text-[var(--gf-persimmon-ink)]"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={busy}
          className="w-full"
        >
          {busy ? "Signing In..." : "Sign In & Merge Bag"}
        </Button>

        <p className="text-center text-xs text-[var(--gf-ink-muted)]">
          New to GOODFORM?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(safeNext)}`}
            className="font-semibold text-[var(--gf-persimmon-ink)] underline"
          >
            Create an account
          </Link>
        </p>
      </form>

      {demoAccountsEnabled ? (
        <div className="rounded-3xl border border-[var(--gf-lilac-border)] bg-[var(--gf-lilac)] p-6 space-y-3">
          <Callout tone="info" title="Non-Production Demo Personas">
            Available only outside commercial production (<code className="font-mono-label">APP_ENV != production</code>). Any items in your guest bag merge automatically.
          </Callout>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              data-testid="demo-login-customer"
              onClick={() => void loginDemo("customer")}
            >
              Demo Customer (Aarav)
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              data-testid="demo-login-admin"
              onClick={() => void loginDemo("admin")}
            >
              Demo Store Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void loginDemo("compliance")}
            >
              Demo Compliance Officer
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void loginDemo("merchandiser")}
            >
              Demo Merchandiser
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SignupForm({ nextUrl }: { nextUrl: string }) {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNext = nextUrl.startsWith("/") && !nextUrl.startsWith("//")
    ? nextUrl
    : "/account";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        return;
      }
      await refreshCart();
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("Network error while creating account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4"
    >
      <div>
        <label
          htmlFor="signup-name"
          className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
        >
          Full Name
        </label>
        <input
          id="signup-name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="signup-email"
          className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
        >
          Email Address
        </label>
        <input
          id="signup-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="signup-phone"
          className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
        >
          Mobile (Optional)
        </label>
        <input
          id="signup-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98201 00000"
          className="mt-1 min-h-11 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
        >
          Password (Minimum 10 characters)
        </label>
        <input
          id="signup-password"
          type="password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 text-sm"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-[var(--gf-persimmon)]/40 bg-[var(--gf-persimmon-soft)] p-3 text-xs font-medium text-[var(--gf-persimmon-ink)]"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={busy}
        className="w-full"
      >
        {busy ? "Creating Account..." : "Create Account & Merge Bag"}
      </Button>

      <p className="text-center text-xs text-[var(--gf-ink-muted)]">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(safeNext)}`}
          className="font-semibold text-[var(--gf-persimmon-ink)] underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
