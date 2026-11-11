import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/domain/auth/rbac";
import { areDemoAccountsEnabled } from "@/env";
import { LoginForm } from "@/components/auth/AuthForms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const nextUrl = nextRaw && nextRaw.startsWith("/") ? nextRaw : "/account";

  if (user) {
    redirect(nextUrl);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <div className="mb-6 text-center">
        <h1 className="font-display text-4xl text-[var(--gf-ink)]">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-[var(--gf-ink-muted)]">
          Sign in to manage routines, Indian delivery addresses, orders, and returns.
        </p>
      </div>

      <LoginForm
        nextUrl={nextUrl}
        demoAccountsEnabled={areDemoAccountsEnabled()}
      />
    </div>
  );
}
