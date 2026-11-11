# Deployment & Operations Runbook

## 1. Hosting & Database Topology

- **Application Host:** Vercel (`goodform-health`, framework preset `nextjs`, Node 22+ runtime).
- **Database:** Managed Neon PostgreSQL (`DATABASE_URL` pooled connection for serverless traffic; `DATABASE_URL_UNPOOLED` direct connection for Drizzle migrations).
- **Local Zero-Config Fallback:** Leaving `DATABASE_URL` empty boots an embedded in-memory PGLite instance with the generated DDL (`src/db/ddl.ts`) and 40-SKU demo seed.

---

## 2. Environment Variables

Configure these in Vercel Project Settings (never commit `.env` or `.env.*`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_ENV` | Yes | `demo` for public preview; `production` for live commercial retail (locks out demo accounts & demo seed SKUs). |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public HTTPS origin (used by canonical links, OG tags, `sitemap.xml`, `robots.txt`). |
| `DATABASE_URL` | Yes (Prod/Demo) | Pooled PostgreSQL connection string (`-pooler` on Neon). |
| `DATABASE_URL_UNPOOLED` | Yes (Migrations) | Direct PostgreSQL connection string for `npm run db:migrate`. |
| `SESSION_SECRET` | Yes | >= 32 random bytes for HMAC guest cookies and hashed rate-limit keys. |
| `MERCHANT_DISPATCH_STATE` | Optional | Defaults to `MH` (Maharashtra) for CGST/SGST vs IGST split. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Optional | Enables live Razorpay India INR checkout & verified webhooks. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Optional | Enables optional Stripe INR Checkout Sessions & verified webhooks. |
| `RESEND_API_KEY` / `EMAIL_FROM` | Optional | Enables live email delivery alongside the `email_outbox` database sink. |

---

## 3. Deploy Order (Schema First, Code Second)

1. Apply migrations against the direct unpooled database URL:
   ```bash
   npm run db:migrate
   ```
2. For a demo preview database only, seed the 40 SKUs and demo fixtures:
   ```bash
   ALLOW_PROD_SEED=1 npm run db:seed:demo
   ```
3. Push to `main` (auto-deploys on Vercel) and verify `/api/health` returns `status: "ok"`, `storageDriver: "postgres"`, and `seededSkuCount: 40`.
