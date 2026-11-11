# System Architecture

GOODFORM is a full-stack Next.js 16 App Router application backed by PostgreSQL (Neon in production, Postgres 17 in CI, and embedded PGLite for zero-config local development) through Drizzle ORM and strict TypeScript.

---

## 1. Domain Boundaries (`src/domain/`)

Domain logic is provider-independent and separated into six bounded modules:

1. **`compliance/` (`fssai-gate.ts`):** Pure rule evaluator for India FSSAI category checks, ICMR-NIN / statutory warning presence, batch expiry checks, prohibited claims scanning, and commercial production demo-seed lockouts.
2. **`catalog/` (`service.ts`):** Hydrates products and variants from PostgreSQL, attaches live `gateVerdict` results, and ensures held SKUs never leak into public feeds.
3. **`routine/` (`overlap.ts`):** Deterministic non-diagnostic recommender, elemental nutrient aggregator across 18 overlap keys, and URL-param sanitizer.
4. **`pricing/` (`totals.ts`, `coupons.ts`):** Integer-paise cart arithmetic, MRP-inclusive Indian GST extraction (`CGST + SGST` intra-state Maharashtra vs `IGST` inter-state), free-shipping threshold rules, and server-side coupon evaluation.
5. **`cart/`, `wishlist/`, `orders/`:** Guest-to-account transactional cart merge, atomic stock deduction (`WHERE stock_on_hand - stock_reserved >= qty`), idempotent order creation (`idempotency_key`), immutable line snapshots, self-serve returns, and 1-click reorder.
6. **`payments/` & `email/`:** Official `razorpay` and `stripe` SDK adapters, constant-time HMAC webhook verification, replay-idempotent `payment_webhook_events` table, honest `DEMO_NON_CHARGING` checkout fallback, and `email_outbox` transactional sink + consent-gated newsletter.
7. **`auth/` (`password.ts`, `session.ts`, `rbac.ts`):** `scrypt` password hashing, SHA-256 hashed session tokens in `httpOnly` cookies, HMAC-signed guest cart cookies, same-origin CSRF checks, hashed-IP rate limiting, server-side RBAC, and `audit_logs`.

---

## 2. Database Schema (`src/db/schema/`)

22 PostgreSQL tables managed via Drizzle migrations (`drizzle/0000_*.sql`):
- **Catalog:** `products`, `product_variants`
- **Identity & Rate Limits:** `users`, `sessions`, `addresses`, `saved_routines`, `rate_limit_buckets`
- **Commerce & Webhooks:** `carts`, `cart_items`, `wishlist_items`, `coupons`, `orders`, `order_items`, `return_requests`, `payment_webhook_events`
- **Content, Email & Governance:** `store_settings`, `learn_articles`, `faqs`, `newsletter_subscribers`, `contact_inquiries`, `email_outbox`, `audit_logs`
