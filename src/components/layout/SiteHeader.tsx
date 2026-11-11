"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Menu, ShieldCheck, ShoppingBag, User, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/chrome/ThemeToggle";
import { useCart } from "@/components/cart/CartContext";
import type { AuthenticatedUser } from "@/domain/auth/session";

export interface SiteHeaderProps {
  user: AuthenticatedUser | null;
  announcementText: string;
}

const NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/collections/foundations", label: "Foundations" },
  { href: "/collections/omega", label: "Omega" },
  { href: "/routine-builder", label: "Routine Builder" },
  { href: "/learn", label: "Learn" },
  { href: "/quality", label: "Quality & FSSAI" },
] as const;

export function SiteHeader({ user, announcementText }: SiteHeaderProps) {
  const { cart, openDrawer } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const count = cart?.totalItemCount ?? 0;
  const isStaff = user && user.role !== "CUSTOMER";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--gf-border)] bg-[var(--gf-bg)]/95 backdrop-blur-md">
      <div className="bg-[var(--gf-aubergine)] px-4 py-1.5 text-center text-xs font-medium text-[var(--gf-on-aubergine)]">
        <p className="mx-auto max-w-6xl truncate">{announcementText}</p>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gf-border)] bg-[var(--gf-surface)] lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <Link href="/" className="shrink-0">
            <Wordmark showSubline />
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex lg:items-center lg:gap-6"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--gf-ink)] transition-colors hover:text-[var(--gf-persimmon)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {isStaff ? (
            <Link
              href="/admin"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--gf-lilac-border)] bg-[var(--gf-lilac)] px-3 text-xs font-semibold text-[var(--gf-lilac-ink)]"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Admin</span>
            </Link>
          ) : null}

          <Link
            href="/wishlist"
            aria-label="Saved wishlist"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gf-border)] bg-[var(--gf-surface)] text-[var(--gf-ink)] hover:bg-[var(--gf-surface-muted)]"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? `Account (${user.fullName})` : "Sign in to account"}
            data-testid="header-account-link"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--gf-border)] bg-[var(--gf-surface)] px-3 text-xs font-medium text-[var(--gf-ink)] hover:bg-[var(--gf-surface-muted)]"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {user ? user.fullName.split(" ")[0] : "Sign In"}
            </span>
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open shopping bag, ${count} item${count === 1 ? "" : "s"}`}
            data-testid="header-bag-button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--gf-persimmon)] px-3.5 text-xs font-semibold text-[var(--gf-on-persimmon)] transition-colors hover:bg-[var(--gf-persimmon-hover)]"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="font-mono-label">{count}</span>
          </button>

          <ThemeToggle />
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[var(--gf-border)] bg-[var(--gf-surface)] px-4 py-4 lg:hidden"
        >
          <ul className="grid gap-2">
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-[var(--gf-surface-muted)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {isStaff ? (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl bg-[var(--gf-lilac)] px-3 py-2 text-sm font-semibold text-[var(--gf-lilac-ink)]"
                >
                  Admin Console ({user.role})
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
