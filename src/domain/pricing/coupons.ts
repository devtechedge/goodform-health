import { eq } from "drizzle-orm";
import { getDb, type DbExecutor } from "@/db/client";
import { coupons } from "@/db/schema/commerce";

export interface CouponRecordLike {
  code: string;
  description: string;
  discountType: "PERCENT" | "FIXED_PAISE";
  discountValue: number;
  minSubtotalPaise: number;
  maxDiscountPaise: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
}

export type CouponEvaluationResult =
  | {
      valid: true;
      code: string;
      description: string;
      discountPaise: number;
    }
  | {
      valid: false;
      reasonCode:
        | "NOT_FOUND"
        | "INACTIVE"
        | "EXPIRED"
        | "USAGE_LIMIT_REACHED"
        | "BELOW_MINIMUM";
      message: string;
    };

export function evaluateCouponRecord(
  coupon: CouponRecordLike | null | undefined,
  subtotalPaise: number,
  now: Date = new Date(),
): CouponEvaluationResult {
  if (!coupon) {
    return {
      valid: false,
      reasonCode: "NOT_FOUND",
      message: "Coupon code was not recognised.",
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      reasonCode: "INACTIVE",
      message: "This coupon code is no longer active.",
    };
  }

  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) {
    return {
      valid: false,
      reasonCode: "EXPIRED",
      message: "This coupon code has expired.",
    };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      reasonCode: "USAGE_LIMIT_REACHED",
      message: "This coupon code has reached its redemption limit.",
    };
  }

  if (subtotalPaise < coupon.minSubtotalPaise) {
    const minInr = Math.ceil(coupon.minSubtotalPaise / 100);
    return {
      valid: false,
      reasonCode: "BELOW_MINIMUM",
      message: `Minimum cart value of INR ${minInr} required for ${coupon.code}.`,
    };
  }

  let discountPaise =
    coupon.discountType === "PERCENT"
      ? Math.round((subtotalPaise * coupon.discountValue) / 100)
      : coupon.discountValue;

  if (
    coupon.maxDiscountPaise !== null &&
    discountPaise > coupon.maxDiscountPaise
  ) {
    discountPaise = coupon.maxDiscountPaise;
  }

  discountPaise = Math.min(subtotalPaise, Math.max(0, discountPaise));

  return {
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountPaise,
  };
}

export async function validateCouponInDb(
  rawCode: string,
  subtotalPaise: number,
  dbOverride?: DbExecutor,
): Promise<CouponEvaluationResult> {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) {
    return {
      valid: false,
      reasonCode: "NOT_FOUND",
      message: "Enter a coupon code.",
    };
  }

  const db = dbOverride ?? (await getDb());
  const [row] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, normalized));

  return evaluateCouponRecord(row, subtotalPaise);
}
