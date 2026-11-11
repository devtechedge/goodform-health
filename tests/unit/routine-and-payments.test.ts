import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ALL_40_SKUS } from "@/db/seeds/all-skus";
import {
  analyzeRoutineSelection,
  parseShareableRoutineSlugs,
  recommendRoutineProducts,
  type RoutineCandidateProduct,
} from "@/domain/routine/overlap";
import { canTransitionOrderStatus } from "@/domain/orders/transitions";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/domain/payments/razorpay";
import { areDemoAccountsEnabled } from "@/env";

const PUBLISHED_CANDIDATES: RoutineCandidateProduct[] = ALL_40_SKUS.filter(
  (s) => s.publishStatus === "PUBLISHED",
).map((s) => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  supplementForm: s.supplementForm,
  dietType: s.dietType,
  routineTags: [...s.routineTags],
  servingsPerPack: s.servingsPerPack,
  startingPricePaise: s.variants[0]!.pricePaise,
  defaultVariantId: s.variants[0]!.id,
  ingredientsJson: [...s.ingredients],
}));

describe("Routine Overlap Engine, Order Transitions & Payment Crypto", () => {
  it("recommends strictly vegan SKUs when VEGAN diet is selected", () => {
    const rec = recommendRoutineProducts(PUBLISHED_CANDIDATES, {
      diet: "VEGAN",
      format: "EITHER",
      focusAreas: ["morning-foundations", "omega-lipid" as never],
    });

    expect(rec.length).toBeGreaterThan(0);
    for (const p of rec) {
      expect(p.dietType).toBe("VEGAN");
    }
  });

  it("flags cumulative Vitamin D3 and Biotin overlap when stacking Daily Multi + D3/K2 + Biotin", () => {
    const multi = PUBLISHED_CANDIDATES.find(
      (p) => p.slug === "daily-multivitamin-mineral",
    )!;
    const d3k2 = PUBLISHED_CANDIDATES.find(
      (p) => p.slug === "vitamin-d3-k2-mk7",
    )!;
    const biotin = PUBLISHED_CANDIDATES.find(
      (p) => p.slug === "biotin-complex",
    )!;

    const analysis = analyzeRoutineSelection([multi, d3k2, biotin]);
    const keys = analysis.cautions.map((c) => c.key);
    expect(keys).toContain("vitamin_d_iu");
    expect(keys).toContain("biotin_mcg");
    expect(keys).toContain("zinc_mg");

    const d3Caution = analysis.cautions.find((c) => c.key === "vitamin_d_iu")!;
    expect(d3Caution.totalAmount).toBe(1000);
    expect(d3Caution.severity).toBe("EXCEEDS_DAILY_REFERENCE");
  });

  it("sanitizes shareable routine query params against published allowlist", () => {
    const allow = new Set(["magnesium-glycinate", "vitamin-d3"]);
    const slugs = parseShareableRoutineSlugs(
      "magnesium-glycinate,shilajit,<script>,vitamin-d3,magnesium-glycinate",
      allow,
    );
    expect(slugs).toEqual(["magnesium-glycinate", "vitamin-d3"]);
  });

  it("enforces allowed order state transitions and rejects invalid backwards hops", () => {
    expect(canTransitionOrderStatus("PENDING_PAYMENT", "CONFIRMED")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "PACKED")).toBe(true);
    expect(canTransitionOrderStatus("CANCELLED", "SHIPPED")).toBe(false);
    expect(canTransitionOrderStatus("RETURNED", "PACKED")).toBe(false);
  });

  it("verifies Razorpay payment & webhook HMAC signatures and rejects tampered signatures", () => {
    const secret = "rzp_test_unit_secret_key_2026_goodform";
    const orderId = "order_P999ABC";
    const paymentId = "pay_P999XYZ";
    const validSig = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSig,
        secretOverride: secret,
      }),
    ).toBe(true);

    const flippedLast = validSig.endsWith("a") ? "b" : "a";
    const tamperedSig = validSig.slice(0, -1) + flippedLast;
    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: tamperedSig,
        secretOverride: secret,
      }),
    ).toBe(false);

    const body = '{"event":"payment.captured"}';
    const whSig = createHmac("sha256", secret).update(body).digest("hex");
    expect(
      verifyRazorpayWebhookSignature({
        rawBody: body,
        signatureHeader: whSig,
        webhookSecretOverride: secret,
      }),
    ).toBe(true);
  });

  it("disables demo accounts strictly when APP_ENV=production", () => {
    expect(
      areDemoAccountsEnabled({
        NODE_ENV: "production",
        APP_ENV: "demo",
      }),
    ).toBe(true);

    expect(
      areDemoAccountsEnabled({
        NODE_ENV: "production",
        APP_ENV: "production",
        DATABASE_URL: "postgres://u:p@localhost:5432/goodform",
        SESSION_SECRET: "a-real-32-byte-minimum-production-secret-key",
      }),
    ).toBe(false);
  });
});
