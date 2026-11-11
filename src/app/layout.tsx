import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "./globals.css";

import { getDb } from "@/db/client";
import { storeSettings } from "@/db/schema/content";
import { getCurrentUser } from "@/domain/auth/rbac";
import { getSiteUrl } from "@/env";
import { BRAND } from "@/lib/brand";
import { ThemeScript } from "@/components/chrome/ThemeScript";
import { CartProvider } from "@/components/cart/CartContext";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${BRAND.name} | ${BRAND.tagline}`,
      template: `%s | ${BRAND.name}`,
    },
    description: BRAND.shortPitch,
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      title: `${BRAND.name} - ${BRAND.tagline}`,
      description: BRAND.shortPitch,
      url: siteUrl,
      locale: "en_IN",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${BRAND.name} - ${BRAND.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${BRAND.name} - ${BRAND.tagline}`,
      description: BRAND.shortPitch,
      images: ["/opengraph-image"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const db = await getDb();
  const [user, settingsRows] = await Promise.all([
    getCurrentUser(),
    db.select().from(storeSettings).where(eq(storeSettings.id, "default")),
  ]);

  const announcementText =
    settingsRows[0]?.announcementBarText ??
    "Pan-India shipping free from INR 999 · Full elemental dosing printed on every jar";

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <CartProvider>
          <SiteHeader user={user} announcementText={announcementText} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
