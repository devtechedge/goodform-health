# India FSSAI & Nutraceutical Compliance Architecture

This document records the Indian statutory rules consulted and enforced by GOODFORM's server-side publishing gate (`src/domain/compliance/fssai-gate.ts`).

**Important Non-Endorsement Statement:** Referencing the Food Safety and Standards Act, 2006 and FSSAI regulations describes GOODFORM's software governance checks only. FSSAI never endorses, approves, or certifies commercial supplement brands.

---

## 1. Official Regulatory Sources Consulted (Verified Nov 2026)

1. **Standards for Health Supplements and Nutraceuticals (FSSAI)**
   - Page: <https://www.fssai.gov.in/standards/health-supplements>
   - Principal Gazette text: *Food Safety and Standards (Health Supplements, Nutraceuticals, Food for Special Dietary Use, Food for Special Medical Purpose, Functional Food, and Novel Food) Regulations, 2016* (`Nutraceuticals_Regulations.pdf`) and *Guidance Note on FSMP*.
   - Eight regulated functional food categories:
     1. Health Supplements
     2. Nutraceuticals
     3. Food for Special Dietary Use (FSDU)
     4. Food for Special Medical Purpose (FSMP)
     5. Specialty foods with botanicals
     6. Probiotic Foods
     7. Prebiotic Foods
     8. Novel Foods
2. **Nutraceuticals Regulation Amendments (FSSAI)**
   - Page: <https://www.fssai.gov.in/food-law/regulations/amendments/nutraceuticals>
   - Gazette Amendment No. 1 (6 September 2021) and subsequent operationalisation directions (`Direction_Nutra_30_03_2022.pdf`, `Food Safety and Standards (Health Supplements, Nutraceuticals...) Regulations, 2022` directions) aligning vitamin/mineral ceilings with ICMR-NIN Recommended Dietary Allowances (RDA).
3. **Advertising and Claims Regulations & Amendments (FSSAI)**
   - Page: <https://www.fssai.gov.in/food-law/regulations/amendments/advertising-claims>
   - Principal regulation: *Food Safety and Standards (Advertising and Claims) Regulations, 2018*, together with Amendments dated 9 October 2020, 30 August 2022, and 13 December 2022.

---

## 2. Server-Side Publishing Gate Rules (`evaluateFssaiPublishingGate`)

Every SKU in PostgreSQL stores `jurisdiction`, `fssaiCategory`, `ingredientEligibilityState`, `complianceReviewState`, `publishStatus`, `fboLicenseNumber`, `fboLicenseVerified`, `manufacturerName`, `warningsJson`, `ownerEvidenceJson`, and `isDemoSeed`.

A SKU is blocked from appearing in `/shop`, `/collections/[slug]`, `/product/[slug]`, `/routine-builder`, `/sitemap.xml`, `/api/cart`, and `/api/checkout` whenever any of the following fail:

1. **Jurisdiction:** `jurisdiction` must equal `"IN"`.
2. **Review State:** `PENDING_LEGAL_REVIEW`, `PENDING_REGULATORY_REVIEW`, `PENDING_BOTANICAL_REVIEW`, `PENDING_NON_SPECIFIED_REVIEW`, and `REJECTED` are blocked.
3. **Ingredient Eligibility:** `ingredientEligibilityState` must be `ELIGIBLE_WITHIN_LIMITS`.
4. **Special Categories (`AYUSH_BORDERLINE`, `BOTANICAL_SPECIALTY`, `NON_SPECIFIED_FOOD`):** Hard-blocked unless `complianceReviewState === "OWNER_VERIFIED"` **and** `fboLicenseVerified === true` **and** `fboLicenseNumber` matches a 14-digit FoSCoS licence (`^\d{14}$`).
5. **Commercial Production Gate (`APP_ENV=production`):** Blocks every SKU where `isDemoSeed === true` or where a verified 14-digit FoSCoS FBO licence is absent.
6. **Mandatory Statutory Warnings:** Must include `"NOT FOR MEDICINAL USE"` and `"Not to exceed the stated recommended daily usage"`.
7. **Batch & Shelf-Life Check:** Active variants must carry a non-empty `batchNumber` and future `expiryDate`.
8. **Prohibited Claims Validator (`validateClaimsCopy`):** Rejects disease cure/treatment claims, unsupported liver-detox or hormone claims, and any statement implying FSSAI or FDA endorsement/approval.

---

## 3. Why 8 of the 40 Seeded SKUs Stay Unpublished

| SKU | Formulation | Hold State | India Regulatory Rationale |
| --- | --- | --- | --- |
| `GF-SLP-005` | Magnesium L-Threonate | `PENDING_NON_SPECIFIED_REVIEW` | L-threonic acid magnesium salt is not a standard Schedule I mineral salt and requires FSSAI Non-Specified Food / Novel Ingredient prior approval. |
| `GF-ANT-025` | Curcumin + Piperine | `PENDING_BOTANICAL_REVIEW` | Requires Schedule IV plant-part/extract-ratio verification plus piperine bioavailability-enhancer and drug-interaction warning sign-off. |
| `GF-SLP-026` | Ashwagandha Root Extract | `PENDING_BOTANICAL_REVIEW` | *Withania somnifera* sits across FSSAI Schedule IV (root-only, zero aerial leaf) and AYUSH regulatory jurisdiction. |
| `GF-ACT-027` | Shilajit | `PENDING_LEGAL_REVIEW` | Regulated in India primarily as an Ayurvedic/ASU substance under the Drugs & Cosmetics Act rather than a food-licence Health Supplement; requires legal & heavy-metal clearance. |
| `GF-ANT-033` | Milk Thistle Extract | `PENDING_BOTANICAL_REVIEW` | *Silybum marianum* seed extract requires Schedule IV specification review and strict substantiation without hepatic disease/detox claims. |
| `GF-ANT-034` | NAC | `PENDING_REGULATORY_REVIEW` | N-Acetyl-L-Cysteine sits at the CDSCO mucolytic drug vs FSSAI nutraceutical Schedule VI boundary. |
| `GF-SLP-036` | L-Theanine | `PENDING_NON_SPECIFIED_REVIEW` | Isolated 200 mg L-theanine requires FSSAI Schedule VI / Non-Specified Food source and daily limit verification. |
| `GF-GUT-038` | Greens & Superfoods Blend | `PENDING_BOTANICAL_REVIEW` | Multi-botanical + *Spirulina* blend requires per-species Schedule IV clearance and batch microcystin/heavy-metal verification. |
