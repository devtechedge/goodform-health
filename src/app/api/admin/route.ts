import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { products, productVariants } from "@/db/schema/catalog";
import { coupons } from "@/db/schema/commerce";
import { faqs, learnArticles, storeSettings } from "@/db/schema/content";
import {
  getCurrentUser,
  roleHasPermission,
  writeAuditLog,
  type AdminPermission,
} from "@/domain/auth/rbac";
import {
  evaluateFssaiPublishingGate,
  validateClaimsCopy,
} from "@/domain/compliance/fssai-gate";
import {
  adminResolveReturnRequest,
  adminTransitionOrderStatus,
} from "@/domain/orders/transitions";
import { assertSameOriginOrJson403 } from "@/lib/http";

export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("updateProduct"),
    productId: z.string().min(2),
    name: z.string().trim().min(2).max(120),
    subtitle: z.string().trim().min(4).max(200),
    shortSummary: z.string().trim().min(10).max(500),
    featuredRank: z.number().int().min(1).max(999).nullable(),
  }),
  z.object({
    action: z.literal("updateVariantInventory"),
    variantId: z.string().min(2),
    pricePaise: z.number().int().min(10000).max(5000000),
    stockOnHand: z.number().int().min(0).max(100000),
    batchNumber: z.string().trim().min(3).max(40),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  z.object({
    action: z.literal("updateProductCompliance"),
    productId: z.string().min(2),
    complianceReviewState: z.enum([
      "APPROVED_DEMO_SEED",
      "PENDING_LEGAL_REVIEW",
      "PENDING_REGULATORY_REVIEW",
      "PENDING_BOTANICAL_REVIEW",
      "PENDING_NON_SPECIFIED_REVIEW",
      "OWNER_VERIFIED",
      "REJECTED",
    ]),
    ingredientEligibilityState: z.enum([
      "ELIGIBLE_WITHIN_LIMITS",
      "PENDING_SCHEDULE_IV_BOTANICAL",
      "PENDING_NON_SPECIFIED_APPROVAL",
      "PENDING_LEGAL_CLASSIFICATION",
      "PENDING_REGULATORY_REVIEW",
      "BLOCKED",
    ]),
    publishStatus: z.enum([
      "PUBLISHED",
      "UNPUBLISHED_HOLD",
      "DRAFT",
      "ARCHIVED",
    ]),
    fboLicenseNumber: z.string().trim().max(20).nullable(),
    fboLicenseVerified: z.boolean(),
    holdReason: z.string().trim().max(500).nullable(),
    isDemoSeed: z.boolean(),
  }),
  z.object({
    action: z.literal("upsertCoupon"),
    code: z.string().trim().min(3).max(24),
    description: z.string().trim().min(4).max(160),
    discountType: z.enum(["PERCENT", "FIXED_PAISE"]),
    discountValue: z.number().int().min(1).max(500000),
    minSubtotalPaise: z.number().int().min(0).max(5000000),
    maxDiscountPaise: z.number().int().min(100).max(500000).nullable(),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal("transitionOrder"),
    orderId: z.string().min(2),
    nextStatus: z.enum([
      "DEMO_ORDER",
      "PENDING_PAYMENT",
      "CONFIRMED",
      "PACKED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURNED",
    ]),
  }),
  z.object({
    action: z.literal("resolveReturn"),
    returnId: z.string().min(2),
    nextStatus: z.enum(["REQUESTED", "APPROVED", "REJECTED", "REFUNDED"]),
    adminNotes: z.string().trim().max(500).default(""),
  }),
  z.object({
    action: z.literal("updateStoreSettings"),
    freeShippingThresholdPaise: z.number().int().min(0).max(1000000),
    standardShippingPaise: z.number().int().min(0).max(100000),
    announcementBarText: z.string().trim().min(5).max(180),
  }),
  z.object({
    action: z.literal("updateFaq"),
    faqId: z.string().min(2),
    question: z.string().trim().min(5).max(240),
    answer: z.string().trim().min(10).max(1200),
    isPublished: z.boolean(),
  }),
  z.object({
    action: z.literal("updateLearnArticle"),
    articleId: z.string().min(2),
    title: z.string().trim().min(5).max(200),
    summary: z.string().trim().min(10).max(600),
    isPublished: z.boolean(),
  }),
]);

const ACTION_PERMISSION: Record<
  z.infer<typeof actionSchema>["action"],
  AdminPermission
> = {
  updateProduct: "products:write",
  updateVariantInventory: "inventory:write",
  updateProductCompliance: "compliance:write",
  upsertCoupon: "coupons:write",
  transitionOrder: "orders:write",
  resolveReturn: "orders:write",
  updateStoreSettings: "content:write",
  updateFaq: "content:write",
  updateLearnArticle: "content:write",
};

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json(
      { error: "Staff authentication required." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid admin payload." },
      { status: 400 },
    );
  }

  const requiredPerm = ACTION_PERMISSION[parsed.data.action];
  if (!roleHasPermission(actor.role, requiredPerm)) {
    return NextResponse.json(
      {
        error: `Role ${actor.role} does not hold permission ${requiredPerm}.`,
      },
      { status: 403 },
    );
  }

  const db = await getDb();
  const payload = parsed.data;

  try {
    if (payload.action === "updateProduct") {
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, payload.productId));

      if (!existing) {
        return NextResponse.json({ error: "Product not found." }, { status: 404 });
      }

      const claimViolations = validateClaimsCopy({
        shortSummary: payload.shortSummary,
        editorialDescription: existing.editorialDescription,
        labelSummary: existing.labelSummary,
      });
      if (claimViolations.length > 0) {
        return NextResponse.json(
          {
            error: claimViolations[0]!.message,
            violations: claimViolations,
          },
          { status: 422 },
        );
      }

      await db
        .update(products)
        .set({
          name: payload.name,
          subtitle: payload.subtitle,
          shortSummary: payload.shortSummary,
          featuredRank: payload.featuredRank,
          updatedAt: new Date(),
        })
        .where(eq(products.id, payload.productId));

      await writeAuditLog(
        {
          actor,
          action: "PRODUCT_MERCHANDISING_UPDATE",
          entityType: "product",
          entityId: payload.productId,
          summary: `Updated merchandising copy/rank on ${existing.sku} (${payload.name})`,
        },
        db,
      );
    } else if (payload.action === "updateVariantInventory") {
      const [existingVar] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, payload.variantId));

      if (!existingVar) {
        return NextResponse.json({ error: "Variant not found." }, { status: 404 });
      }

      await db
        .update(productVariants)
        .set({
          pricePaise: payload.pricePaise,
          stockOnHand: payload.stockOnHand,
          batchNumber: payload.batchNumber,
          expiryDate: payload.expiryDate,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, payload.variantId));

      await writeAuditLog(
        {
          actor,
          action: "VARIANT_INVENTORY_UPDATE",
          entityType: "variant",
          entityId: payload.variantId,
          summary: `Updated variant ${existingVar.sku}: price=${payload.pricePaise}p, stock=${payload.stockOnHand}, batch=${payload.batchNumber}`,
          metadata: {
            beforePricePaise: existingVar.pricePaise,
            afterPricePaise: payload.pricePaise,
            beforeStock: existingVar.stockOnHand,
            afterStock: payload.stockOnHand,
          },
        },
        db,
      );
    } else if (payload.action === "updateProductCompliance") {
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, payload.productId));

      if (!existing) {
        return NextResponse.json({ error: "Product not found." }, { status: 404 });
      }

      const vars = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, existing.id));

      if (payload.publishStatus === "PUBLISHED") {
        const verdict = evaluateFssaiPublishingGate({
          slug: existing.slug,
          name: existing.name,
          jurisdiction: existing.jurisdiction,
          fssaiCategory: existing.fssaiCategory,
          ingredientEligibilityState: payload.ingredientEligibilityState,
          complianceReviewState: payload.complianceReviewState,
          publishStatus: payload.publishStatus,
          fboLicenseNumber: payload.fboLicenseNumber,
          fboLicenseVerified: payload.fboLicenseVerified,
          manufacturerName: existing.manufacturerName,
          warningsJson: existing.warningsJson,
          shortSummary: existing.shortSummary,
          editorialDescription: existing.editorialDescription,
          labelSummary: existing.labelSummary,
          isDemoSeed: payload.isDemoSeed,
          activeVariants: vars
            .filter((v) => v.isActive)
            .map((v) => ({
              sku: v.sku,
              batchNumber: v.batchNumber,
              expiryDate: v.expiryDate,
            })),
        });

        if (!verdict.allowed) {
          return NextResponse.json(
            {
              error: `FSSAI Publishing Gate blocked publishing ${existing.name}: ${verdict.violations[0]?.message}`,
              violations: verdict.violations,
            },
            { status: 422 },
          );
        }
      }

      await db
        .update(products)
        .set({
          complianceReviewState: payload.complianceReviewState,
          ingredientEligibilityState: payload.ingredientEligibilityState,
          publishStatus: payload.publishStatus,
          fboLicenseNumber: payload.fboLicenseNumber || null,
          fboLicenseVerified: payload.fboLicenseVerified,
          holdReason: payload.holdReason || null,
          isDemoSeed: payload.isDemoSeed,
          updatedAt: new Date(),
        })
        .where(eq(products.id, payload.productId));

      await writeAuditLog(
        {
          actor,
          action: "COMPLIANCE_GATE_UPDATE",
          entityType: "product",
          entityId: payload.productId,
          summary: `Updated FSSAI compliance state on ${existing.sku} -> ${payload.publishStatus} (${payload.complianceReviewState})`,
        },
        db,
      );
    } else if (payload.action === "upsertCoupon") {
      const upperCode = payload.code.toUpperCase();
      const [existing] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, upperCode));

      if (existing) {
        await db
          .update(coupons)
          .set({
            description: payload.description,
            discountType: payload.discountType,
            discountValue: payload.discountValue,
            minSubtotalPaise: payload.minSubtotalPaise,
            maxDiscountPaise: payload.maxDiscountPaise,
            isActive: payload.isActive,
          })
          .where(eq(coupons.id, existing.id));
      } else {
        await db.insert(coupons).values({
          id: `cpn_${randomBytes(10).toString("hex")}`,
          code: upperCode,
          description: payload.description,
          discountType: payload.discountType,
          discountValue: payload.discountValue,
          minSubtotalPaise: payload.minSubtotalPaise,
          maxDiscountPaise: payload.maxDiscountPaise,
          isActive: payload.isActive,
        });
      }

      await writeAuditLog(
        {
          actor,
          action: "COUPON_UPSERT",
          entityType: "coupon",
          entityId: upperCode,
          summary: `Upserted coupon ${upperCode} (active=${payload.isActive})`,
        },
        db,
      );
    } else if (payload.action === "transitionOrder") {
      await adminTransitionOrderStatus(
        actor,
        payload.orderId,
        payload.nextStatus,
        db,
      );
    } else if (payload.action === "resolveReturn") {
      await adminResolveReturnRequest(
        actor,
        payload.returnId,
        payload.nextStatus,
        payload.adminNotes,
        db,
      );
    } else if (payload.action === "updateStoreSettings") {
      await db
        .update(storeSettings)
        .set({
          freeShippingThresholdPaise: payload.freeShippingThresholdPaise,
          standardShippingPaise: payload.standardShippingPaise,
          announcementBarText: payload.announcementBarText,
          updatedAt: new Date(),
        })
        .where(eq(storeSettings.id, "default"));

      await writeAuditLog(
        {
          actor,
          action: "STORE_SETTINGS_UPDATE",
          entityType: "store_settings",
          entityId: "default",
          summary: `Updated free shipping threshold to ${payload.freeShippingThresholdPaise}p`,
        },
        db,
      );
    } else if (payload.action === "updateFaq") {
      const claimViolations = validateClaimsCopy({
        shortSummary: payload.question,
        editorialDescription: payload.answer,
        labelSummary: "",
      });
      if (claimViolations.length > 0) {
        return NextResponse.json(
          { error: claimViolations[0]!.message, violations: claimViolations },
          { status: 422 },
        );
      }

      const [existingFaq] = await db
        .select()
        .from(faqs)
        .where(eq(faqs.id, payload.faqId));
      if (!existingFaq) {
        return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
      }

      await db
        .update(faqs)
        .set({
          question: payload.question,
          answer: payload.answer,
          isPublished: payload.isPublished,
        })
        .where(eq(faqs.id, payload.faqId));

      await writeAuditLog(
        {
          actor,
          action: "FAQ_CONTENT_UPDATE",
          entityType: "faq",
          entityId: payload.faqId,
          summary: `Updated FAQ ${payload.faqId} (published=${payload.isPublished})`,
        },
        db,
      );
      revalidatePath("/faq");
    } else if (payload.action === "updateLearnArticle") {
      const claimViolations = validateClaimsCopy({
        shortSummary: payload.title,
        editorialDescription: payload.summary,
        labelSummary: "",
      });
      if (claimViolations.length > 0) {
        return NextResponse.json(
          { error: claimViolations[0]!.message, violations: claimViolations },
          { status: 422 },
        );
      }

      const [existingArt] = await db
        .select()
        .from(learnArticles)
        .where(eq(learnArticles.id, payload.articleId));
      if (!existingArt) {
        return NextResponse.json({ error: "Monograph not found." }, { status: 404 });
      }

      await db
        .update(learnArticles)
        .set({
          title: payload.title,
          summary: payload.summary,
          isPublished: payload.isPublished,
          updatedAt: new Date(),
        })
        .where(eq(learnArticles.id, payload.articleId));

      await writeAuditLog(
        {
          actor,
          action: "LEARN_MONOGRAPH_UPDATE",
          entityType: "learn_article",
          entityId: payload.articleId,
          summary: `Updated monograph "${payload.title}" (published=${payload.isPublished})`,
        },
        db,
      );
      revalidatePath("/learn");
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Admin action failed." },
      { status: 422 },
    );
  }
}
