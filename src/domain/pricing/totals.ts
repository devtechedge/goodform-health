export interface PricedLineInput {
  variantId: string;
  unitPricePaise: number;
  quantity: number;
  gstRateBps: number;
}

export interface ShippingAndTaxConfig {
  freeShippingThresholdPaise: number;
  standardShippingPaise: number;
  dispatchStateCode: string;
  destinationStateCode?: string;
}

export interface OrderPricingBreakdown {
  subtotalPaise: number;
  discountPaise: number;
  discountedMerchandisePaise: number;
  shippingPaise: number;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalGstPaise: number;
  totalPaise: number;
  isIntraState: boolean;
  freeShippingRemainingPaise: number;
}

function assertNonNegativeSafeInt(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer in paise (received ${value}).`);
  }
}

/**
 * Computes deterministic integer-paise order totals and extracts Indian GST
 * (CGST + SGST for intra-state vs IGST for inter-state) from MRP-inclusive prices.
 * Invariant: taxablePaise + cgstPaise + sgstPaise + igstPaise === totalPaise.
 */
export function computeOrderPricing(
  lines: readonly PricedLineInput[],
  rawCouponDiscountPaise: number,
  config: ShippingAndTaxConfig,
): OrderPricingBreakdown {
  assertNonNegativeSafeInt(rawCouponDiscountPaise, "rawCouponDiscountPaise");
  assertNonNegativeSafeInt(
    config.freeShippingThresholdPaise,
    "freeShippingThresholdPaise",
  );
  assertNonNegativeSafeInt(config.standardShippingPaise, "standardShippingPaise");

  if (lines.length === 0) {
    return {
      subtotalPaise: 0,
      discountPaise: 0,
      discountedMerchandisePaise: 0,
      shippingPaise: 0,
      taxablePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalGstPaise: 0,
      totalPaise: 0,
      isIntraState: true,
      freeShippingRemainingPaise: config.freeShippingThresholdPaise,
    };
  }

  let subtotalPaise = 0;
  let weightedGstNumerator = 0;

  for (const line of lines) {
    assertNonNegativeSafeInt(line.unitPricePaise, "unitPricePaise");
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("Line quantity must be a positive integer.");
    }
    const lineTotal = line.unitPricePaise * line.quantity;
    subtotalPaise += lineTotal;
    weightedGstNumerator += lineTotal * line.gstRateBps;
  }

  const discountPaise = Math.min(subtotalPaise, rawCouponDiscountPaise);
  const discountedMerchandisePaise = subtotalPaise - discountPaise;

  const shippingPaise =
    discountedMerchandisePaise >= config.freeShippingThresholdPaise
      ? 0
      : config.standardShippingPaise;

  const freeShippingRemainingPaise = Math.max(
    0,
    config.freeShippingThresholdPaise - discountedMerchandisePaise,
  );

  const totalPaise = discountedMerchandisePaise + shippingPaise;
  const effectiveGstBps =
    subtotalPaise > 0 ? Math.round(weightedGstNumerator / subtotalPaise) : 1800;

  const taxablePaise = Math.round(
    (totalPaise * 10_000) / (10_000 + effectiveGstBps),
  );
  const totalGstPaise = totalPaise - taxablePaise;

  const dispatchState = (config.dispatchStateCode || "MH").trim().toUpperCase();
  const destState = (config.destinationStateCode || dispatchState)
    .trim()
    .toUpperCase();
  const isIntraState = destState === dispatchState;

  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (isIntraState) {
    cgstPaise = Math.floor(totalGstPaise / 2);
    sgstPaise = totalGstPaise - cgstPaise;
  } else {
    igstPaise = totalGstPaise;
  }

  return {
    subtotalPaise,
    discountPaise,
    discountedMerchandisePaise,
    shippingPaise,
    taxablePaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalGstPaise,
    totalPaise,
    isIntraState,
    freeShippingRemainingPaise,
  };
}
