import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = (
  process.env.SMOKE_BASE_URL ?? "https://goodform-health.vercel.app"
).replace(/\/+$/, "");

const PUBLIC_ROUTES = [
  "/",
  "/shop",
  "/product/liposomal-glutathione",
  "/collections/foundations",
  "/collections/omega",
  "/collections/gut",
  "/collections/beauty",
  "/collections/sleep",
  "/collections/active",
  "/collections/vitamins",
  "/collections/antioxidants",
  "/routine-builder",
  "/learn",
  "/about",
  "/quality",
  "/faq",
  "/contact",
  "/shipping",
  "/returns",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/cart",
  "/orders/track",
  "/wishlist",
  "/login",
  "/signup",
] as const;

const outDir = path.resolve(process.cwd(), "docs/screenshots");
fs.mkdirSync(outDir, { recursive: true });

console.log(`Probing live production deployment at ${BASE_URL}...`);

// 1. Health + headers + robots + sitemap
const healthRes = await fetch(`${BASE_URL}/api/health`);
if (!healthRes.ok) {
  throw new Error(`/api/health returned ${healthRes.status}`);
}
const healthJson = (await healthRes.json()) as {
  status: string;
  storageDriver: string;
  seededSkuCount: number;
};
console.log("Health:", JSON.stringify(healthJson));
if (healthJson.status !== "ok" || healthJson.seededSkuCount !== 40) {
  throw new Error("Unexpected /api/health payload.");
}

for (const hdr of [
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
]) {
  if (!healthRes.headers.get(hdr)) {
    throw new Error(`Missing security header: ${hdr}`);
  }
}

const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
const sitemapXml = await sitemapRes.text();
if (
  !sitemapXml.includes(`${BASE_URL}/product/liposomal-glutathione`) ||
  sitemapXml.includes("/product/shilajit") ||
  sitemapXml.includes("/product/nac")
) {
  throw new Error("Sitemap validation failed (missing flagship or leaked held SKU).");
}

const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
const robotsTxt = await robotsRes.text();
if (!robotsTxt.includes("Disallow: /admin")) {
  throw new Error("robots.txt missing /admin disallow rule.");
}

// 2. Browser QA + live screenshot capture
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const errors: string[] = [];
page.on("pageerror", (err) => errors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

for (const route of PUBLIC_ROUTES) {
  const res = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
  });
  if (!res || res.status() !== 200) {
    throw new Error(`Route ${route} returned status ${res?.status()}`);
  }

  const check = await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll("img"));
    await Promise.all(
      imgs
        .filter((i) => i.loading !== "lazy" && !i.complete)
        .map(
          (i) =>
            new Promise<void>((resolve) => {
              i.addEventListener("load", () => resolve(), { once: true });
              i.addEventListener("error", () => resolve(), { once: true });
            }),
        ),
    );
    const broken = imgs
      .filter((i) => i.loading !== "lazy" && (!i.complete || i.naturalWidth === 0))
      .map((i) => i.src);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      broken,
    };
  });

  if (check.scrollWidth > check.innerWidth) {
    throw new Error(
      `Desktop overflow on ${route}: ${check.scrollWidth} > ${check.innerWidth}`,
    );
  }
  if (check.broken.length > 0) {
    throw new Error(`Broken eager images on ${route}: ${check.broken.join(", ")}`);
  }
}

// Mobile 390px overflow sweep on key routes
await page.setViewportSize({ width: 390, height: 844 });
for (const route of ["/", "/shop", "/product/liposomal-glutathione", "/routine-builder", "/quality"]) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
  }));
  if (m.sw > m.iw) {
    throw new Error(`Mobile 390px overflow on ${route}: ${m.sw} > ${m.iw}`);
  }
}

// Capture 4 README screenshots at 1440x900 + dark 1280x640 social preview
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
await page.locator("h1").waitFor();
await page.screenshot({
  path: path.join(outDir, "01-storefront-home.png"),
});

await page.goto(`${BASE_URL}/product/magnesium-glycinate`, {
  waitUntil: "load",
});
await page.getByRole("heading", { name: "Supplement Facts" }).waitFor();
await page.screenshot({
  path: path.join(outDir, "02-product-supplement-facts.png"),
});

await page.goto(
  `${BASE_URL}/routine-builder?items=daily-multivitamin-mineral,vitamin-d3-k2-mk7,biotin-complex`,
  { waitUntil: "load" },
);
await page.getByTestId("routine-cautions-region").waitFor();
await page.screenshot({
  path: path.join(outDir, "03-routine-builder-overlaps.png"),
});

await page.goto(`${BASE_URL}/login?next=/admin`, {
  waitUntil: "load",
});
await page.getByTestId("demo-login-admin").click();
await page.getByRole("heading", { name: /Dispensary Operations & Reports/i }).waitFor();
await page.goto(`${BASE_URL}/admin/compliance`, { waitUntil: "load" });
await page.getByTestId("compliance-row-GF-ACT-027").waitFor();
await page.screenshot({
  path: path.join(outDir, "04-admin-fssai-gate.png"),
});

// Dark-mode 1280x640 social preview (< 1MB) in clean anonymous visitor state
await context.clearCookies();
await page.setViewportSize({ width: 1280, height: 640 });
await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
await page.getByTestId("theme-toggle").click();
await page.waitForTimeout(350);
const socialPath = path.join(outDir, "social-preview.png");
await page.screenshot({ path: socialPath });

const socialBytes = fs.statSync(socialPath).size;
if (socialBytes >= 1_000_000) {
  throw new Error(`social-preview.png exceeds 1 MB (${socialBytes} bytes).`);
}

await browser.close();

if (errors.length > 0) {
  throw new Error(`Live console/page errors detected: ${errors.join(" | ")}`);
}

console.log(
  `Live production smoke & screenshot capture PASSED (${PUBLIC_ROUTES.length} routes, 0 console errors, 0 overflow, social-preview=${Math.round(socialBytes / 1024)}KB).`,
);
export {};
