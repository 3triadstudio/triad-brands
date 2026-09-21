import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", title: /Triad Brands|Branding, Digital, Print, Merch/i },
  { path: "/about", title: /Brands|Triad Brands/i },
  { path: "/solutions", title: /Services|Triad Brands/i },
  { path: "/shop", title: /Shop|Triad Brands/i },
  { path: "/contact", title: /Contact|Triad Brands/i },
];

for (const route of routes) {
  test(`loads ${route.path} without crashing`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(
      /Triad Brands|Branding|Make the brand|Shop the catalog|Contact/i,
    );
    await expect(page).toHaveTitle(new RegExp(route.title, "i"));

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    expect(description?.length ?? 0).toBeGreaterThanOrEqual(80);
    expect(description?.length ?? 0).toBeLessThanOrEqual(160);
  });
}

test("core pages carry distinct titles and canonical metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Triad Brands.*(Branding|Nairobi)/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /https:\/\/www\.triadbrands\.co\.ke\//,
  );

  await page.goto("/about");
  await expect(page).toHaveTitle(/about.*triad brands|triad brands.*about/i);

  await page.goto("/contact");
  await expect(page).toHaveTitle(/contact.*triad brands|triad brands.*contact/i);
});

test("shop catalog shows catalog content without crashing", async ({ page }) => {
  await page.goto("/shop");

  await expect(page.locator("body")).toContainText(/Branded goods|Browse the catalog|From KES/i);
  await expect(page.locator("body")).toContainText(
    /Thermo Flasks|Premium tote bag|Custom Embroidered Polo/i,
  );

  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
});

test("shop page shows cookie consent and quick-view product modal", async ({ page }) => {
  await page.goto("/shop");

  await expect(page.getByRole("button", { name: /accept cookies/i })).toBeVisible();
  await page
    .getByRole("button", { name: /quick view/i })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(/details|quantity|size/i);
});

test("contact page renders the contact CTA and email action", async ({ page }) => {
  await page.goto("/contact");

  await expect(page.locator("body")).toContainText(
    /Start with the thing that matters|Start a project|Tell us what you are building/i,
  );
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
});

test("service and category pages render non-empty content", async ({ page }) => {
  await page.goto("/solutions");
  await expect(page.getByRole("heading", { name: /Make the brand/i })).toBeVisible();

  await page.goto("/category/apparel");
  await expect(page.getByRole("heading", { name: /Apparel & Wearables|Apparel/i })).toBeVisible();
  await expect(page.locator("text=No products found in this category").first()).not.toBeVisible();
});
