# Product Specification: GOODFORM

**Brand:** GOODFORM  
**Tagline:** Better inputs. More good days.  
**Model:** Single-merchant, single-brand direct-to-consumer (DTC) holistic supplements store for India (INR).

---

## 1. Positioning & Differentiation

GOODFORM is built as an optimistic modern Indian apothecary focused on everyday nutrition essentials:
- **Single-brand retail, not a marketplace:** No third-party sellers, no B2B institutional RFQ workflows, and no clinical/RUO peptide catalogues.
- **Elemental stoichiometry on the front label:** Mineral SKUs state both compound salt weight (for example 1,715 mg unbuffered magnesium bisglycinate) and true elemental nutrient yield (240 mg elemental Mg).
- **Honest merchandising:** Zero fabricated star ratings, zero fake customer review counts, zero countdown urgency timers, and zero unverified certification seals. Market context badges cite external sources (`impuls8`, `ConsumerLab`, `Loop Health WHI`, `iHerb India`) with methodology caveats documented in `docs/RESEARCH.md`.

---

## 2. Storefront Information Architecture

- `/` - Flagship Liposomal Glutathione hero, 8-SKU featured dispensary, 8 collection cards, macro stoichiometry spotlight, Routine Builder callout, FSSAI publishing gate summary, accordion FAQs, and explicit-consent newsletter signup.
- `/shop` - Full search, collection filter, dietary origin filter (`ALL` / `VEGETARIAN` / `VEGAN`), delivery form filter, in-stock filter, 4 sort modes, and pagination across the 32 published SKUs.
- `/product/[slug]` - Bespoke concept packshot, optional macro plate, variant selector, quantity stepper, Supplement Facts monograph table, directions, mandatory FSSAI warnings, provenance status, and Product JSON-LD.
- `/collections/[slug]` - Eight curated shelves: `foundations`, `omega`, `gut`, `beauty`, `sleep`, `active`, `vitamins`, and `antioxidants`.
- `/routine-builder` - Non-diagnostic everyday preference filter, live cumulative elemental intake table, ICMR-NIN nutrient overlap cautions, daily/pack INR totals, 1-click batch add-to-bag, account save, and shareable URL query state.
- `/learn` & `/learn/[slug]` - Five primary-sourced nutrition, stoichiometry, and regulatory monographs.
- `/about`, `/quality`, `/faq`, `/contact`, `/shipping`, `/returns`, `/privacy`, `/terms`, `/disclaimer` - Complete trust, grievance, shipping/GST, and statutory disclosure pages.
- `/cart`, `/wishlist`, `/checkout`, `/login`, `/signup`, `/account`, `/account/orders/[id]` - End-to-end guest & signed-in commerce lifecycle.
- `/admin` (`/products`, `/compliance`, `/coupons`, `/orders`, `/settings`, `/audit`) - Server RBAC staff console with immutable audit logging.
