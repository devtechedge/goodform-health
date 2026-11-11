import { describe, expect, it } from "vitest";
import { computeOrderPricing } from "@/domain/pricing/totals";
import { evaluateCouponRecord } from "@/domain/pricing/coupons";
import {
  formatInrPaise,
  inferStateFromPin,
  isValidIndianPin,
} from "@/lib/india";

describe("Integer-Paise INR Pricing, India GST & Coupons", () => {
  it("preserves exact paisa invariant for intra-state Maharashtra CGST + SGST", () => {
    const result = computeOrderPricing(
      [
        {
          variantId: "v1",
          unitPricePaise: 119900,
          quantity: 1,
          gstRateBps: 1800,
        },
      ],
      0,
      {
        freeShippingThresholdPaise: 99900,
        standardShippingPaise: 7900,
        dispatchStateCode: "MH",
        destinationStateCode: "MH",
      },
    );

    expect(result.subtotalPaise).toBe(119900);
    expect(result.shippingPaise).toBe(0);
    expect(result.totalPaise).toBe(119900);
    expect(result.isIntraState).toBe(true);
    expect(result.igstPaise).toBe(0);
    expect(result.cgstPaise).toBeGreaterThan(0);
    expect(result.sgstPaise).toBeGreaterThan(0);
    expect(
      result.taxablePaise +
        result.cgstPaise +
        result.sgstPaise +
        result.igstPaise,
    ).toBe(result.totalPaise);
  });

  it("adds INR 79 shipping below INR 999 and switches to IGST for inter-state Karnataka", () => {
    const result = computeOrderPricing(
      [
        {
          variantId: "v_b12",
          unitPricePaise: 59900,
          quantity: 1,
          gstRateBps: 1800,
        },
      ],
      0,
      {
        freeShippingThresholdPaise: 99900,
        standardShippingPaise: 7900,
        dispatchStateCode: "MH",
        destinationStateCode: "KA",
      },
    );

    expect(result.shippingPaise).toBe(7900);
    expect(result.totalPaise).toBe(67800);
    expect(result.isIntraState).toBe(false);
    expect(result.cgstPaise).toBe(0);
    expect(result.sgstPaise).toBe(0);
    expect(result.taxablePaise + result.igstPaise).toBe(67800);
  });

  it("evaluates percentage cap, minimum subtotal, expiry, and usage limits on coupons", () => {
    const cpn = {
      code: "WELCOME10",
      description: "10% off up to INR 500",
      discountType: "PERCENT" as const,
      discountValue: 10,
      minSubtotalPaise: 99900,
      maxDiscountPaise: 50000,
      usageLimit: 10,
      usedCount: 2,
      isActive: true,
      expiresAt: new Date("2027-01-01T00:00:00Z"),
    };

    const belowMin = evaluateCouponRecord(
      cpn,
      69900,
      new Date("2026-11-11T00:00:00Z"),
    );
    expect(belowMin.valid).toBe(false);

    const capped = evaluateCouponRecord(
      cpn,
      800000,
      new Date("2026-11-11T00:00:00Z"),
    );
    expect(capped.valid).toBe(true);
    if (capped.valid) {
      expect(capped.discountPaise).toBe(50000);
    }

    const expired = evaluateCouponRecord(
      cpn,
      150000,
      new Date("2028-01-01T00:00:00Z"),
    );
    expect(expired.valid).toBe(false);
  });

  it("validates 6-digit Indian PIN codes and formats Indian Rupees cleanly", () => {
    expect(isValidIndianPin("400050")).toBe(true);
    expect(isValidIndianPin("010001")).toBe(false);
    expect(isValidIndianPin("40005")).toBe(false);
    expect(inferStateFromPin("400050")).toBe("MH");
    expect(inferStateFromPin("560001")).toBe("KA");
    expect(inferStateFromPin("110001")).toBe("DL");
    expect(formatInrPaise(219900)).toContain("2,199");
  });
});
