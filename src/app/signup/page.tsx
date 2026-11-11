import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/domain/auth/rbac";
import { SignupForm } from "@/components/auth/AuthForms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account",
  robots: { index: false, follow: false },
};

interface SignupPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
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
          Create your GOODFORM account
        </h1>
        <p className="mt-1 text-sm text-[var(--gf-ink-muted)]">
          Any formulations currently in your guest bag will merge automatically.
        </p>
      </div>

      <SignupForm nextUrl={nextUrl} />
    </div>
  );
}
