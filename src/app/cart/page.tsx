import React from "react";
import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = {
  title: "Your Apothecary Bag",
  description:
    "Review your GOODFORM supplement formulations, apply coupon codes, and preview intra-state CGST+SGST or inter-state IGST before checkout.",
  alternates: { canonical: "/cart" },
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageClient />;
}
