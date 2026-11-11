import { NextResponse } from "next/server";
import { z } from "zod";
import { listPublicCatalog } from "@/domain/catalog/service";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().max(120).optional(),
  collection: z.string().max(40).optional(),
  diet: z.enum(["VEGAN", "VEGETARIAN", "ALL"]).optional(),
  form: z.string().max(30).optional(),
  inStockOnly: z.enum(["true", "false"]).optional(),
  sort: z
    .enum(["featured", "price-asc", "price-desc", "name-asc"])
    .optional(),
  page: z.coerce.number().int().min(1).max(50).optional(),
  pageSize: z.coerce.number().int().min(1).max(48).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid catalog query parameters." },
      { status: 400 },
    );
  }

  const data = await listPublicCatalog({
    q: parsed.data.q,
    collection: parsed.data.collection,
    diet: parsed.data.diet,
    form: parsed.data.form,
    inStockOnly: parsed.data.inStockOnly === "true",
    sort: parsed.data.sort,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  });

  return NextResponse.json(data);
}
