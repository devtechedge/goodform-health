import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("GOODFORM End-to-End Storefront, Compliance, Commerce & WCAG 2.2 AA", () => {
  test("renders distinct GOODFORM home, passes WCAG 2.2 AA axe checks in light & dark mode, and has zero console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Better inputs\. More good days\./i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Liposomal Glutathione/i }).first(),
    ).toBeVisible();

    // Axe WCAG 2.2 AA audit in default warm-ivory light mode
    const lightAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      lightAxe.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      ),
    ).toEqual([]);

    // Keyboard skip link & theme toggle to nocturnal aubergine dark mode
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const darkAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      darkAxe.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      ),
    ).toEqual([]);

    expect(consoleErrors).toEqual([]);
  });

  test("enforces FSSAI publishing gate across /shop, /product/[slug], /collections/[slug], and /quality", async ({
    page,
  }) => {
    await page.goto("/shop");
    await expect(
      page.getByRole("heading", { name: /All Published Formulations/i }),
    ).toBeVisible();
    await expect(
      page.getByTestId("product-card-magnesium-glycinate"),
    ).toBeVisible();

    // Held SKUs must NOT appear in /shop
    await expect(page.getByTestId("product-card-shilajit")).toHaveCount(0);
    await expect(page.getByTestId("product-card-nac")).toHaveCount(0);

    // Direct navigation to held SKU /product/shilajit renders withheld 404 screen
    await page.goto("/product/shilajit");
    await expect(
      page.getByRole("heading", {
        name: /not on the public shelf/i,
      }),
    ).toBeVisible();

    // Published PDP renders Supplement Facts and mandatory FSSAI warnings, plus passes axe
    await page.goto("/product/liposomal-glutathione");
    await expect(
      page.getByRole("heading", { name: "Supplement Facts" }),
    ).toBeVisible();
    await expect(page.getByText(/NOT FOR MEDICINAL USE/i).first()).toBeVisible();

    const pdpAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(
      pdpAxe.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      ),
    ).toEqual([]);

    // Collection shelf works
    await page.goto("/collections/omega");
    await expect(
      page.getByRole("heading", { name: "Omega", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByTestId("product-card-vegan-algal-omega-3"),
    ).toBeVisible();

    // Quality charter transparently lists all 8 withheld SKUs
    await page.goto("/quality");
    await expect(page.getByText("GF-ACT-027", { exact: true })).toBeVisible();
    await expect(page.getByText("GF-ANT-034", { exact: true })).toBeVisible();
  });

  test("computes live nutrient overlap cautions in /routine-builder and adds stack to bag", async ({
    page,
  }) => {
    await page.goto(
      "/routine-builder?items=daily-multivitamin-mineral,vitamin-d3-k2-mk7,biotin-complex",
    );

    const cautionsRegion = page.getByTestId("routine-cautions-region");
    await expect(cautionsRegion).toContainText("Vitamin D3 (Cholecalciferol)");
    await expect(cautionsRegion).toContainText("1000 IU");
    await expect(cautionsRegion).toContainText("D-Biotin");

    const rbAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(
      rbAxe.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      ),
    ).toEqual([]);

    await page.getByTestId("routine-add-all").click();
    await expect(page.getByRole("dialog", { name: /Your apothecary bag/i })).toBeVisible();
    await expect(page.getByTestId("drawer-checkout-link")).toBeVisible();
  });

  test("completes guest-to-customer cart merge, honest non-charging demo checkout, and account view", async ({
    page,
  }) => {
    await page.goto("/product/magnesium-glycinate");
    await page.getByTestId("pdp-add-to-bag").click();
    await expect(page.getByTestId("drawer-checkout-link")).toBeVisible();
    await page.keyboard.press("Escape");

    // Sign in as Demo Customer -> merges guest cart
    await page.goto("/login?next=/checkout");
    await page.getByTestId("demo-login-customer").click();

    await expect(
      page.getByRole("heading", { name: "Checkout" }),
    ).toBeVisible();

    // Fill PIN for Bengaluru (KA) to verify inter-state IGST calculation
    await page.locator("#chk-pin").fill("560001");
    await page.locator("#chk-city").fill("Bengaluru");
    await expect(page.getByText(/IGST \(18% Inter-State\)/i)).toBeVisible();

    await page.getByTestId("place-order-button").click();

    await expect(page.getByTestId("checkout-confirmation")).toBeVisible();
    await expect(
      page.getByTestId("confirmation-payment-status"),
    ).toHaveText("DEMO_NON_CHARGING");
  });

  test("protects /admin with server RBAC and enforces FSSAI gate on pending SKUs", async ({
    page,
  }) => {
    // Unauthenticated visitor redirected to /login
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=(?:%2F|\/)admin/);

    await page.getByTestId("demo-login-admin").click();
    await expect(
      page.getByRole("heading", { name: /Dispensary Operations & Reports/i }),
    ).toBeVisible();

    await page.goto("/admin/compliance");
    const shilajitForm = page.getByTestId("compliance-row-GF-ACT-027");
    await expect(shilajitForm).toBeVisible();

    // Try setting Shilajit to PUBLISHED without OWNER_VERIFIED + 14-digit FoSCoS licence
    await shilajitForm.locator("select").nth(2).selectOption("PUBLISHED");
    await shilajitForm.getByRole("button", { name: /Apply Gate Update/i }).click();
    await expect(shilajitForm.getByRole("alert")).toContainText(
      /FSSAI Publishing Gate blocked publishing Shilajit/i,
    );

    // Verify /admin/settings FAQ CMS blocks prohibited medical claims and logs valid updates
    await page.goto("/admin/settings");
    const faqForm = page.getByTestId("faq-editor-faq_01");
    await expect(faqForm).toBeVisible();
    const originalAnswer = await faqForm.locator("textarea").inputValue();

    await faqForm.locator("textarea").fill("FSSAI approved capsule that cures diabetes.");
    await faqForm.getByRole("button", { name: "Save FAQ" }).click();
    await expect(faqForm.getByRole("alert")).toContainText(/Never imply FSSAI/i);

    await faqForm.locator("textarea").fill(originalAnswer);
    await faqForm.getByRole("button", { name: "Save FAQ" }).click();
    await expect(faqForm.getByRole("status")).toContainText(/Saved & audited/i);
  });

  test("verifies /contact & /cart metadata, /shop filter chips, /quality batch verifier, wishlist sync, and /orders/track", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(page).toHaveTitle(/Contact & Grievance Desk \| GOODFORM/);
    const contactCanonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(contactCanonical).toMatch(/\/contact$/);

    await page.goto("/cart");
    await expect(page).toHaveTitle(/Your Apothecary Bag \| GOODFORM/);
    const cartRobots = await page
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(cartRobots).toContain("noindex");

    // Active filter chips + per-serving cost on /shop
    await page.goto("/shop?q=Magnesium&inStock=true");
    await expect(page.getByTestId("shop-active-filters")).toContainText(
      'Search: "Magnesium"',
    );
    await expect(
      page.getByTestId("product-card-magnesium-glycinate"),
    ).toContainText("/serving");

    // Interactive Batch & SKU Compliance Verifier on /quality
    await page.goto("/quality");
    await page.getByRole("button", { name: /GF26K04D/i }).click();
    await expect(page.getByTestId("batch-verifier-result")).toContainText(
      "PUBLISHED · GATE CLEAR",
    );
    await page.getByRole("button", { name: /GF-ACT-027/i }).click();
    await expect(page.getByTestId("batch-verifier-result")).toContainText(
      "WITHHELD (PENDING_LEGAL_REVIEW)",
    );

    // Privacy-safe Guest Order Lookup (/orders/track)
    await page.goto("/orders/track?order=GF-2026-1001");
    await page.locator("#trk-email").fill("wrong@example.in");
    await page.getByTestId("track-order-submit").click();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      /No order matched/i,
    );

    await page.locator("#trk-email").fill("aarav@goodform.demo");
    await page.getByTestId("track-order-submit").click();
    await expect(page.getByTestId("tracked-order-card")).toContainText(
      "GF-2026-1001",
    );

    // Wishlist context hydration across page navigation
    await page.goto("/login?next=/shop");
    await page.getByTestId("demo-login-customer").click();
    await expect(
      page.getByRole("heading", { name: /All Published Formulations/i }),
    ).toBeVisible();
    const card = page.getByTestId("product-card-vitamin-d3-k2-mk7");
    await card
      .getByRole("button", { name: /Save Vitamin D3 \+ K2 MK-7 to wishlist/i })
      .click();
    await expect(
      card.getByRole("button", {
        name: /Remove Vitamin D3 \+ K2 MK-7 from wishlist/i,
      }),
    ).toBeVisible();

    await page.goto("/wishlist");
    await expect(
      page.getByTestId("product-card-vitamin-d3-k2-mk7"),
    ).toBeVisible();
  });

  test("has zero horizontal overflow at 390px, 768px, and 1440px across key routes", async ({
    page,
  }) => {
    const routes = [
      "/",
      "/shop",
      "/product/magnesium-glycinate",
      "/routine-builder",
      "/learn",
      "/quality",
    ];
    const widths = [390, 768, 1440];

    for (const width of widths) {
      await page.setViewportSize({ width, height: 860 });
      for (const route of routes) {
        await page.goto(route);
        const metrics = await page.evaluate(() => {
          const vw = window.innerWidth;
          const sw = document.documentElement.scrollWidth;
          const offenders: string[] = [];
          if (sw > vw) {
            for (const el of Array.from(document.querySelectorAll("*"))) {
              const r = el.getBoundingClientRect();
              if (r.right > vw + 1) {
                offenders.push(
                  `${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 40)}@${Math.round(r.right)}`,
                );
              }
            }
          }
          return {
            scrollWidth: sw,
            innerWidth: vw,
            offenders: offenders.slice(0, 5),
          };
        });
        expect(
          metrics.scrollWidth,
          `Horizontal overflow on ${route} at ${width}px (${metrics.offenders.join(", ")})`,
        ).toBeLessThanOrEqual(metrics.innerWidth);
      }
    }
  });
});
