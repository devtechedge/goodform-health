import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_ENV: z
      .enum(["development", "test", "demo", "production"])
      .optional(),
    NEXT_PUBLIC_SITE_URL: z.preprocess(
      emptyToUndefined,
      z.string().url().default("http://localhost:3000"),
    ),
    DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    DATABASE_URL_UNPOOLED: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    TEST_DATABASE_URL: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    SESSION_SECRET: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .min(32)
        .default("goodform-dev-session-secret-not-for-production-2026"),
    ),
    RAZORPAY_KEY_ID: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    RAZORPAY_KEY_SECRET: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    RAZORPAY_WEBHOOK_SECRET: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    STRIPE_SECRET_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    STRIPE_PUBLISHABLE_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    STRIPE_WEBHOOK_SECRET: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    RESEND_API_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    EMAIL_FROM: z.preprocess(
      emptyToUndefined,
      z.string().default("GOODFORM Care <care@goodform.example>"),
    ),
    MERCHANT_DISPATCH_STATE: z.preprocess(
      emptyToUndefined,
      z.string().length(2).default("MH"),
    ),
    ALLOW_PROD_SEED: z.preprocess(
      emptyToUndefined,
      z.enum(["0", "1"]).optional(),
    ),
    VERCEL_GIT_COMMIT_SHA: z.preprocess(
      emptyToUndefined,
      z.string().optional(),
    ),
  })
  .superRefine((data, ctx) => {
    const resolvedAppEnv =
      data.APP_ENV ?? (data.NODE_ENV === "test" ? "test" : "development");
    if (resolvedAppEnv === "production") {
      if (!data.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "DATABASE_URL is required when APP_ENV=production.",
        });
      }
      if (
        data.SESSION_SECRET ===
        "goodform-dev-session-secret-not-for-production-2026"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SESSION_SECRET"],
          message:
            "A unique 32+ character SESSION_SECRET is required when APP_ENV=production.",
        });
      }
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function parseEnv(raw: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(raw);
}

export function getEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

export function resetEnvCacheForTests(): void {
  cachedEnv = null;
}

export function getEffectiveAppEnv(
  raw: NodeJS.ProcessEnv = process.env,
): "development" | "test" | "demo" | "production" {
  const env = raw === process.env ? getEnv() : parseEnv(raw);
  if (env.APP_ENV) return env.APP_ENV;
  if (env.NODE_ENV === "test") return "test";
  return "development";
}

/**
 * Demo accounts are strictly barred in commercial production (APP_ENV=production).
 * They are available only in development, test, and explicit demo preview environments.
 */
export function areDemoAccountsEnabled(
  raw: NodeJS.ProcessEnv = process.env,
): boolean {
  return getEffectiveAppEnv(raw) !== "production";
}

export function isRazorpayConfigured(
  raw: NodeJS.ProcessEnv = process.env,
): boolean {
  const env = raw === process.env ? getEnv() : parseEnv(raw);
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

export function isStripeConfigured(
  raw: NodeJS.ProcessEnv = process.env,
): boolean {
  const env = raw === process.env ? getEnv() : parseEnv(raw);
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getAvailablePaymentProviders(
  raw: NodeJS.ProcessEnv = process.env,
): Array<"razorpay" | "stripe" | "demo"> {
  const providers: Array<"razorpay" | "stripe" | "demo"> = [];
  if (isRazorpayConfigured(raw)) providers.push("razorpay");
  if (isStripeConfigured(raw)) providers.push("stripe");
  if (providers.length === 0 || getEffectiveAppEnv(raw) !== "production") {
    providers.push("demo");
  }
  return providers;
}

export function getSiteUrl(raw: NodeJS.ProcessEnv = process.env): string {
  const env = raw === process.env ? getEnv() : parseEnv(raw);
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
}
