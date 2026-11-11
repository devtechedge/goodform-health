import React from "react";
import type { Metadata } from "next";
import { ContactFormClient } from "@/components/pages/ContactFormClient";

export const metadata: Metadata = {
  title: "Contact & Grievance Desk",
  description:
    "Reach GOODFORM's Mumbai batch-quality and consumer grievance redressal desk for order, shipping, or FSSAI compliance inquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactFormClient />;
}
