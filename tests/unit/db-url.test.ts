import { describe, expect, it } from "vitest";
import { normalizePgConnectionString } from "@/db/url";

describe("normalizePgConnectionString", () => {
  it("appends uselibpqcompat=true when sslmode=require lacks explicit compat flag", () => {
    const raw =
      "postgresql://user:pass@ep-demo.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
    const normalized = normalizePgConnectionString(raw);
    expect(normalized).toContain("sslmode=require");
    expect(normalized).toContain("uselibpqcompat=true");
  });

  it("leaves plain local URLs and already-configured URLs unchanged", () => {
    const local = "postgresql://postgres:postgres@localhost:5432/goodform_test";
    expect(normalizePgConnectionString(local)).toBe(local);

    const explicit =
      "postgresql://user:pass@host/neondb?sslmode=verify-full";
    expect(normalizePgConnectionString(explicit)).toBe(explicit);
  });
});
