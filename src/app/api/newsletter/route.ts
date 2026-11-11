import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/domain/auth/session";
import { subscribeToNewsletter } from "@/domain/email/service";
import { assertSameOriginOrJson403, extractClientKey } from "@/lib/http";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().email().max(160),
  consentAccepted: z.boolean(),
});

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const limit = await checkRateLimit(
    "newsletter",
    extractClientKey(request),
    10,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many subscription requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address and consent selection." },
      { status: 400 },
    );
  }

  try {
    const result = await subscribeToNewsletter(parsed.data);
    return NextResponse.json({
      ok: true,
      alreadyActive: result.alreadyActive,
      message: result.alreadyActive
        ? "This email is already subscribed to GOODFORM notes."
        : "Subscribed with explicit consent recorded. A one-click unsubscribe link has been sent.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Subscription failed." },
      { status: 400 },
    );
  }
}
