import { NextResponse } from "next/server";
import { loadAllHydratedProducts } from "@/domain/catalog/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawCode = (url.searchParams.get("code") ?? "").trim();
  if (rawCode.length < 2 || rawCode.length > 64) {
    return NextResponse.json(
      { error: "Enter a SKU (e.g. GF-FND-004) or Batch code (e.g. GF26K04D)." },
      { status: 400 },
    );
  }

  const needle = rawCode.toUpperCase();
  const slugNeedle = rawCode.toLowerCase();
  const all = await loadAllHydratedProducts();

  for (const prod of all) {
    const matchedVariant = prod.variants.find(
      (v) =>
        v.batchNumber.toUpperCase() === needle ||
        v.sku.toUpperCase() === needle,
    );
    const productMatched =
      prod.sku.toUpperCase() === needle || prod.slug === slugNeedle;

    if (matchedVariant || productMatched) {
      const targetVar = matchedVariant ?? prod.defaultVariant;
      return NextResponse.json({
        ok: true,
        record: {
          productName: prod.name,
          productSlug: prod.slug,
          productSku: prod.sku,
          variantSku: targetVar.sku,
          variantTitle: targetVar.title,
          batchNumber: targetVar.batchNumber,
          manufacturedDate: targetVar.manufacturedDate,
          expiryDate: targetVar.expiryDate,
          jurisdiction: prod.jurisdiction,
          fssaiCategory: prod.fssaiCategory,
          complianceReviewState: prod.complianceReviewState,
          publishStatus: prod.publishStatus,
          canAppearInPublicStore: prod.gateVerdict.canAppearInPublicStore,
          holdReason: prod.holdReason,
          violations: prod.gateVerdict.violations,
          ingredients: prod.ingredientsJson.map((i) => ({
            name: i.name,
            compoundForm: i.compoundForm,
            amountDisplay: i.amountDisplay,
          })),
          fboLicenseVerified: prod.fboLicenseVerified,
          fboLicenseStatus:
            prod.fboLicenseVerified && prod.fboLicenseNumber
              ? prod.fboLicenseNumber
              : "Unverified demo seed placeholder (no fabricated FoSCoS licence)",
          coaStatus:
            prod.ownerEvidenceJson.labTestingVerified &&
            prod.ownerEvidenceJson.coaUrl
              ? "Verified COA on file"
              : "Unverified demo seed (no fabricated COA)",
          manufacturerName: prod.manufacturerName,
          isDemoSeed: prod.isDemoSeed,
        },
      });
    }
  }

  return NextResponse.json(
    {
      error: `No GOODFORM SKU or batch record matched "${rawCode}".`,
    },
    { status: 404 },
  );
}
