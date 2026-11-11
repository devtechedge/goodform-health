import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/domain/email/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const ok = await unsubscribeByToken(token);

  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe - GOODFORM</title><style>body{font-family:system-ui,sans-serif;background:#fcf8f2;color:#261124;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{max-width:460px;background:#fffdf9;border:1px solid #e3d7c8;border-radius:16px;padding:28px}a{color:#c8432b;font-weight:600}</style></head><body><main class="card"><h1>${ok ? "You are unsubscribed" : "Unsubscribe link invalid or expired"}</h1><p>${ok ? "Your email address has been removed from GOODFORM dispatches." : "No active subscription matched that token."}</p><p><a href="/">Return to GOODFORM</a></p></main></body></html>`,
    {
      status: ok ? 200 : 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
