# Testing & Quality Assurance Guide

GOODFORM enforces four automated verification layers locally and in GitHub Actions CI (`.github/workflows/ci.yml`).

---

## 1. Static Analysis
```bash
npm run lint
npm run typecheck
npm audit --omit=dev
```
- Runs ESLint 9 (`eslint-config-next` core-web-vitals + strict TypeScript rules) and `next typegen && tsc --noEmit`.

## 2. Unit Suite (`tests/unit/`)
```bash
npm test
```
Covers:
- 40-SKU invariant and packshot parity
- India FSSAI publishing gate (32 published vs 8 withheld SKUs, commercial production lockout, expired batches, missing statutory warnings, prohibited claims scanner)
- Integer-paise INR pricing, intra-state CGST+SGST vs inter-state IGST exact-paisa invariant, coupons, and Indian PIN/mobile validation
- Non-diagnostic Routine Builder dietary filtering and cumulative nutrient overlap cautions
- Order state machine transitions and constant-time Razorpay HMAC verification (including byte-flipped tamper rejection)

## 3. PostgreSQL Integration Suite (`tests/integration/`)
```bash
npm run test:integration
```
Runs against `TEST_DATABASE_URL` (Postgres 17 in CI) or isolated PGLite locally:
- SQL catalog filtering & server rejection of held SKUs (`SKU_COMPLIANCE_BLOCKED`)
- Guest-to-account transactional cart + coupon merge
- Transactional `DEMO_NON_CHARGING` order creation, idempotency replay, and concurrent stock oversell rollback
- Razorpay/Stripe webhook idempotency (`UNIQUE(provider, provider_event_id)`) and stock restoration on cancellation
- Cross-user IDOR rejection (`FORBIDDEN`), 1-click reorder, self-serve return resolution, RBAC matrix, audit trail writes, and explicit-consent newsletter + 1-click token unsubscribe

## 4. Production-Build Playwright & Accessibility Suite (`e2e/`)
```bash
npm run build
npm run e2e
```
Boots `next start` against the production build and verifies:
- Brand rendering, light/dark theme toggle, and zero console/page errors
- `@axe-core/playwright` WCAG 2.2 AA scans across `/`, `/product/[slug]`, and `/routine-builder` (light and dark themes)
- FSSAI gate enforcement on `/shop`, `/product/shilajit` (withheld 404), `/collections/omega`, and `/quality`
- End-to-end guest cart -> customer demo login merge -> Karnataka PIN `560001` IGST -> honest `DEMO_NON_CHARGING` confirmation
- Admin RBAC redirect + live `/admin/compliance` server rejection when attempting to publish Shilajit without verified clearance
- Programmatic horizontal overflow check (`scrollWidth <= innerWidth`) at `390px`, `768px`, and `1440px`
