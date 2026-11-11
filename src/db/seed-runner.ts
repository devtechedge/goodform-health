import { sql } from "drizzle-orm";
import type { Database } from "./client";
import {
  addresses,
  auditLogs,
  cartItems,
  carts,
  contactInquiries,
  coupons,
  emailOutbox,
  faqs,
  learnArticles,
  newsletterSubscribers,
  orderItems,
  orders,
  paymentWebhookEvents,
  products,
  productVariants,
  rateLimitBuckets,
  returnRequests,
  savedRoutines,
  sessions,
  storeSettings,
  users,
  wishlistItems,
} from "./schema";
import { ALL_40_SKUS } from "./seeds/all-skus";
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD_PLAINTEXT,
  SEED_COUPONS,
  SEED_FAQS,
  SEED_LEARN_ARTICLES,
} from "./seeds/content-and-fixtures";
import { hashPassword } from "@/domain/auth/password";

export interface SeedOptions {
  includeDemoAccounts?: boolean;
  resetExisting?: boolean;
}

export async function seedDatabase(
  db: Database,
  options: SeedOptions = {},
): Promise<{ productCount: number; variantCount: number; publishedCount: number }> {
  if (options.resetExisting) {
    // Delete in strict FK dependency order
    await db.delete(returnRequests);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(paymentWebhookEvents);
    await db.delete(cartItems);
    await db.delete(carts);
    await db.delete(wishlistItems);
    await db.delete(savedRoutines);
    await db.delete(addresses);
    await db.delete(sessions);
    await db.delete(rateLimitBuckets);
    await db.delete(emailOutbox);
    await db.delete(contactInquiries);
    await db.delete(newsletterSubscribers);
    await db.delete(auditLogs);
    await db.delete(coupons);
    await db.delete(faqs);
    await db.delete(learnArticles);
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(users);
    await db.delete(storeSettings);
  }

  // 1. Store settings
  await db
    .insert(storeSettings)
    .values({
      id: "default",
      freeShippingThresholdPaise: 99900,
      standardShippingPaise: 7900,
      defaultGstRateBps: 1800,
      dispatchStateCode: "MH",
      announcementBarText:
        "Pan-India shipping free from INR 999 · Full elemental dosing printed on every jar",
    })
    .onConflictDoNothing();

  // 2. All 40 SKUs and their variants
  let variantCount = 0;
  let publishedCount = 0;

  for (const sku of ALL_40_SKUS) {
    if (sku.publishStatus === "PUBLISHED") {
      publishedCount += 1;
    }

    await db
      .insert(products)
      .values({
        id: sku.id,
        sku: sku.sku,
        slug: sku.slug,
        name: sku.name,
        subtitle: sku.subtitle,
        shortSummary: sku.shortSummary,
        editorialDescription: sku.editorialDescription,
        primaryCollection: sku.primaryCollection,
        collectionSlugs: [...sku.collectionSlugs],
        supplementForm: sku.supplementForm,
        servingSizeLabel: sku.servingSizeLabel,
        servingsPerPack: sku.servingsPerPack,
        netQuantityLabel: sku.netQuantityLabel,
        ingredientsJson: [...sku.ingredients],
        otherIngredients: sku.otherIngredients,
        dietType: sku.dietType,
        allergenFlags: [...sku.allergenFlags],
        labelSummary: sku.labelSummary,
        directionsForUse: sku.directionsForUse,
        warningsJson: [...sku.warnings],
        storageInstructions: sku.storageInstructions,
        imagePath: sku.imagePath,
        macroImagePath: sku.macroImagePath ?? null,
        isFlagship: Boolean(sku.isFlagship),
        featuredRank: sku.featuredRank ?? null,
        marketSignalBadge: sku.marketSignalBadge ?? null,
        marketSignalSourceUrl: sku.marketSignalSourceUrl ?? null,
        routineTags: [...sku.routineTags],
        fssaiCategory: sku.fssaiCategory,
        ingredientEligibilityState: sku.ingredientEligibilityState,
        complianceReviewState: sku.complianceReviewState,
        publishStatus: sku.publishStatus,
        holdReason: sku.holdReason ?? null,
        jurisdiction: "IN",
        fboLicenseNumber: null,
        fboLicenseVerified: false,
        manufacturerName: sku.manufacturerName,
        importerDetails: null,
        countryOfOrigin: sku.countryOfOrigin ?? "India",
        ownerEvidenceJson: {
          coaUrl: null,
          labTestingVerified: false,
          gmpVerified: false,
          notes:
            "Seeded demo formulation record. Owner FoSCoS FBO licence and batch COA must be verified before commercial release.",
        },
        isDemoSeed: true,
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: sku.name,
          subtitle: sku.subtitle,
          shortSummary: sku.shortSummary,
          editorialDescription: sku.editorialDescription,
          publishStatus: sku.publishStatus,
          complianceReviewState: sku.complianceReviewState,
          ingredientEligibilityState: sku.ingredientEligibilityState,
          holdReason: sku.holdReason ?? null,
          updatedAt: sql`now()`,
        },
      });

    for (const v of sku.variants) {
      variantCount += 1;
      await db
        .insert(productVariants)
        .values({
          id: v.id,
          productId: sku.id,
          sku: v.sku,
          title: v.title,
          packLabel: v.packLabel,
          servingsCount: v.servingsCount,
          pricePaise: v.pricePaise,
          gstRateBps: v.gstRateBps ?? 1800,
          weightGrams: v.weightGrams,
          stockOnHand: v.stockOnHand,
          stockReserved: 0,
          batchNumber: v.batchNumber,
          manufacturedDate: v.manufacturedDate,
          expiryDate: v.expiryDate,
          isDefault: v.isDefault,
          isActive: true,
        })
        .onConflictDoNothing();
    }
  }

  // 3. Learn articles
  for (const article of SEED_LEARN_ARTICLES) {
    await db
      .insert(learnArticles)
      .values({
        id: article.id,
        slug: article.slug,
        title: article.title,
        category: article.category,
        readingMinutes: article.readingMinutes,
        summary: article.summary,
        sectionsJson: article.sections,
        referencesJson: [...article.references],
        isPublished: true,
        sortOrder: article.sortOrder,
      })
      .onConflictDoNothing();
  }

  // 4. FAQs
  for (const faq of SEED_FAQS) {
    await db
      .insert(faqs)
      .values({
        id: faq.id,
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        isPublished: true,
      })
      .onConflictDoNothing();
  }

  // 5. Coupons
  for (const cpn of SEED_COUPONS) {
    await db
      .insert(coupons)
      .values({
        id: cpn.id,
        code: cpn.code,
        description: cpn.description,
        discountType: cpn.discountType,
        discountValue: cpn.discountValue,
        minSubtotalPaise: cpn.minSubtotalPaise,
        maxDiscountPaise: cpn.maxDiscountPaise,
        usageLimit: cpn.usageLimit,
        usedCount: 0,
        isActive: true,
      })
      .onConflictDoNothing();
  }

  // 6. Non-production demo accounts + sample customer address & demo order
  if (options.includeDemoAccounts) {
    const passwordHash = hashPassword(DEMO_PASSWORD_PLAINTEXT);
    for (const acc of DEMO_ACCOUNTS) {
      await db
        .insert(users)
        .values({
          id: acc.id,
          email: acc.email,
          fullName: acc.fullName,
          passwordHash,
          role: acc.role,
          phone: acc.phone,
          isDemoAccount: true,
          isActive: true,
        })
        .onConflictDoNothing();
    }

    await db
      .insert(addresses)
      .values({
        id: "addr_demo_mumbai",
        userId: "usr_demo_customer",
        label: "Home",
        recipientName: "Aarav Kulkarni",
        phone: "+91 98201 44110",
        line1: "402 Gulmohar Residency, Chapel Road",
        line2: "Bandra West",
        landmark: "Near Mount Carmel Church",
        city: "Mumbai",
        stateCode: "MH",
        pinCode: "400050",
        isDefault: true,
      })
      .onConflictDoNothing();

    await db
      .insert(savedRoutines)
      .values({
        id: "rtn_demo_foundations",
        userId: "usr_demo_customer",
        title: "Weekday Indoor Desk Stack",
        preferencesJson: {
          diet: "VEGETARIAN",
          format: "EITHER",
          focus: "indoor-daylight",
        },
        productSlugsJson: [
          "vitamin-d3-k2-mk7",
          "magnesium-glycinate",
          "methylcobalamin-b12",
        ],
      })
      .onConflictDoNothing();

    await db
      .insert(orders)
      .values({
        id: "ord_demo_seed_001",
        orderNumber: "GF-2026-1001",
        userId: "usr_demo_customer",
        customerEmail: "aarav@goodform.demo",
        customerName: "Aarav Kulkarni",
        idempotencyKey: "seed-demo-order-1001",
        orderStatus: "DEMO_ORDER",
        paymentProvider: "demo",
        paymentStatus: "DEMO_NON_CHARGING",
        subtotalPaise: 214800,
        discountPaise: 0,
        shippingPaise: 0,
        taxablePaise: 182034,
        cgstPaise: 16383,
        sgstPaise: 16383,
        igstPaise: 0,
        totalPaise: 214800,
        shippingAddressJson: {
          recipientName: "Aarav Kulkarni",
          phone: "+91 98201 44110",
          line1: "402 Gulmohar Residency, Chapel Road",
          line2: "Bandra West",
          city: "Mumbai",
          stateCode: "MH",
          stateName: "Maharashtra",
          pinCode: "400050",
        },
        isDemoOrder: true,
        notes: "Seeded non-charging demo order for account history walkthrough.",
      })
      .onConflictDoNothing();

    await db
      .insert(orderItems)
      .values([
        {
          id: "oi_demo_seed_001_a",
          orderId: "ord_demo_seed_001",
          productId: "prod_04_magnesium_glycinate",
          variantId: "var_04_45s",
          sku: "GF-FND-004-45",
          productSlug: "magnesium-glycinate",
          productName: "Magnesium Glycinate",
          variantTitle: "45 Servings · 90 Veg Capsules",
          batchNumber: "GF26K04D",
          expiryDate: "2028-09-30",
          ingredientSnapshot: "240 mg Elemental Magnesium (Unbuffered Bisglycinate)",
          quantity: 1,
          unitPricePaise: 119900,
          gstRateBps: 1800,
          lineTotalPaise: 119900,
        },
        {
          id: "oi_demo_seed_001_b",
          orderId: "ord_demo_seed_001",
          productId: "prod_07_vitamin_d3_k2",
          variantId: "var_07_90s",
          sku: "GF-VIT-007-90",
          productSlug: "vitamin-d3-k2-mk7",
          productName: "Vitamin D3 + K2 MK-7",
          variantTitle: "90 Servings · 90 Veg Capsules",
          batchNumber: "GF26K07D",
          expiryDate: "2028-10-04",
          ingredientSnapshot: "600 IU Vitamin D3 + 55 mcg Vitamin K2 (MK-7)",
          quantity: 1,
          unitPricePaise: 94900,
          gstRateBps: 1800,
          lineTotalPaise: 94900,
        },
      ])
      .onConflictDoNothing();
  }

  return {
    productCount: ALL_40_SKUS.length,
    variantCount,
    publishedCount,
  };
}
