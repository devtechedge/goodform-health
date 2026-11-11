import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import { emailOutbox, newsletterSubscribers } from "@/db/schema/content";
import { getEnv, getSiteUrl } from "@/env";
import { formatInrPaise } from "@/lib/india";

export interface SendEmailInput {
  toEmail: string;
  subject: string;
  templateKey: string;
  bodyText: string;
}

export async function dispatchTransactionalEmail(
  input: SendEmailInput,
  dbOverride?: Database,
): Promise<{ id: string; transportMode: "DEV_SINK" | "PROVIDER_SENT" }> {
  const db = dbOverride ?? (await getDb());
  const env = getEnv();
  let transportMode: "DEV_SINK" | "PROVIDER_SENT" = "DEV_SINK";

  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [input.toEmail],
          subject: input.subject,
          text: input.bodyText,
        }),
      });
      if (response.ok) {
        transportMode = "PROVIDER_SENT";
      }
    } catch {
      transportMode = "DEV_SINK";
    }
  }

  const id = `eml_${randomBytes(12).toString("hex")}`;
  await db.insert(emailOutbox).values({
    id,
    toEmail: input.toEmail.trim().toLowerCase(),
    subject: input.subject,
    templateKey: input.templateKey,
    bodyText: input.bodyText,
    transportMode,
  });

  return { id, transportMode };
}

export async function sendOrderReceiptEmail(
  params: {
    toEmail: string;
    customerName: string;
    orderNumber: string;
    totalPaise: number;
    isDemoOrder: boolean;
    paymentStatus: string;
  },
  dbOverride?: Database,
) {
  const modeNote = params.isDemoOrder
    ? "NON-CHARGING DEMO ORDER (Payment Status: DEMO_NON_CHARGING - No card or UPI was charged)."
    : `Payment Status: ${params.paymentStatus}.`;

  return dispatchTransactionalEmail(
    {
      toEmail: params.toEmail,
      subject: `GOODFORM Order ${params.orderNumber} ${params.isDemoOrder ? "(Demo - Unpaid)" : "Confirmation"}`,
      templateKey: "order_receipt",
      bodyText: [
        `Hello ${params.customerName},`,
        "",
        `We recorded your GOODFORM order ${params.orderNumber} totalling ${formatInrPaise(params.totalPaise)}.`,
        modeNote,
        "",
        "Mandatory notice: Health Supplements / Nutraceuticals. Not for medicinal use.",
      ].join("\n"),
    },
    dbOverride,
  );
}

export const NEWSLETTER_CONSENT_STATEMENT =
  "I explicitly consent to receive occasional formulation notes and label-literacy guides from GOODFORM by email, and understand I can unsubscribe with one click at any time.";

export async function subscribeToNewsletter(
  params: {
    email: string;
    consentAccepted: boolean;
  },
  dbOverride?: Database,
): Promise<{ unsubscribeToken: string; alreadyActive: boolean }> {
  if (!params.consentAccepted) {
    throw new Error(
      "Explicit consent is required before subscribing to the GOODFORM dispatch.",
    );
  }

  const cleanEmail = params.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Enter a valid email address.");
  }

  const db = dbOverride ?? (await getDb());
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, cleanEmail));

  if (existing && existing.status === "ACTIVE") {
    return { unsubscribeToken: existing.unsubscribeToken, alreadyActive: true };
  }

  const token =
    existing?.unsubscribeToken ?? randomBytes(24).toString("base64url");

  if (existing) {
    await db
      .update(newsletterSubscribers)
      .set({
        status: "ACTIVE",
        consentAccepted: true,
        consentTextSnapshot: NEWSLETTER_CONSENT_STATEMENT,
        subscribedAt: new Date(),
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscribers.id, existing.id));
  } else {
    await db.insert(newsletterSubscribers).values({
      id: `sub_${randomBytes(12).toString("hex")}`,
      email: cleanEmail,
      consentAccepted: true,
      consentTextSnapshot: NEWSLETTER_CONSENT_STATEMENT,
      status: "ACTIVE",
      unsubscribeToken: token,
    });
  }

  const unsubUrl = `${getSiteUrl()}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
  await dispatchTransactionalEmail(
    {
      toEmail: cleanEmail,
      subject: "GOODFORM Dispatch: Subscription Confirmed",
      templateKey: "newsletter_welcome",
      bodyText: `Thank you for opting into GOODFORM's ingredient & label-literacy notes.\n\nUnsubscribe anytime in one click: ${unsubUrl}`,
    },
    db,
  );

  return { unsubscribeToken: token, alreadyActive: false };
}

export async function unsubscribeByToken(
  token: string,
  dbOverride?: Database,
): Promise<boolean> {
  if (!token || token.trim().length < 10) return false;
  const db = dbOverride ?? (await getDb());
  const updated = await db
    .update(newsletterSubscribers)
    .set({
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    })
    .where(eq(newsletterSubscribers.unsubscribeToken, token.trim()))
    .returning();

  return updated.length > 0;
}
