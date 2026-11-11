# Security Policy & Threat Model

## Supported Versions

| Version | Supported |
| --- | --- |
| `1.0.x` (`main`) | Yes |

To report a vulnerability, open a private security advisory on GitHub or contact `grievance@goodform.example` (demo contact). Never post live credentials or personal data in public issues.

---

## Threat Model & Controls Implemented

1. **Authentication & Session Storage**
   - Passwords are hashed with Node `crypto.scryptSync` using 16-byte random per-user salts and verified with `crypto.timingSafeEqual`.
   - Browser sessions use `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookies (`gf_session`). Only the `SHA-256` digest of the session token is stored in PostgreSQL (`sessions.token_hash`).
   - Guest carts use HMAC-SHA256 signed `httpOnly` tokens (`gf_guest_cart`) verified in constant time.

2. **Demo Account Lockout in Commercial Production**
   - Seeded `@goodform.demo` personas exist strictly for local, CI, and non-commercial demo previews (`APP_ENV != "production"`).
   - Setting `APP_ENV=production` disables `/api/auth/demo`, rejects `@goodform.demo` logins (`403`), requires an explicit 32+ character `SESSION_SECRET` and `DATABASE_URL` at boot, and blocks `isDemoSeed` SKUs in the FSSAI publishing gate.

3. **Authorization (RBAC & IDOR Prevention)**
   - Every `/admin/*` page calls `requireAdminPageUser()` on the server, and `/api/admin` checks granular role permissions (`CUSTOMER`, `MERCHANDISER`, `COMPLIANCE_OFFICER`, `ADMIN`) before executing any mutation.
   - Customer order reads, reorders, returns, addresses, and routines scope queries strictly to the authenticated `user.id`.
   - All staff mutations append an immutable record to `audit_logs`.

4. **Pricing, Stock, & Payment Integrity**
   - Client requests send only `variantId`, `quantity`, and `couponCode`; unit prices, discounts, shipping, and GST are recomputed exclusively from PostgreSQL inside transactions.
   - Stock decrements use conditional atomic SQL updates (`WHERE (stock_on_hand - stock_reserved) >= qty`) to prevent overselling.
   - Zero card/UPI numbers touch GOODFORM servers. Razorpay callbacks/webhooks and Stripe webhooks verify cryptographic signatures and deduplicate replays via `payment_webhook_events`.
   - When live payment keys are absent, orders record `paymentStatus = "DEMO_NON_CHARGING"` and `orderStatus = "DEMO_ORDER"` (never `"PAID"`).

5. **HTTP Headers, CSRF, & Privacy**
   - Mutating cookie-authenticated endpoints enforce same-origin checks (`Origin` / `Host` / `Sec-Fetch-Site`).
   - Responses include `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `Strict-Transport-Security` (in production).
   - Rate-limit buckets HMAC-hash client identifiers so raw IP addresses are not persisted in PostgreSQL.
