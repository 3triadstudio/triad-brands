import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", title: /Triad Studio|Branding, Digital, Print, Merch/i },
  { path: "/about", title: /Studio|Triad Studio/i },
  { path: "/solutions", title: /Services|Triad Studio/i },
  { path: "/shop", title: /Shop|Triad Studio/i },
  { path: "/contact", title: /Contact|Triad Studio/i },
];

for (const route of routes) {
  test(`loads ${route.path} without crashing`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(
      /Triad Studio|Branding|Make the brand|Shop the catalog|Contact/i,
    );
    await expect(page).toHaveTitle(new RegExp(route.title, "i"));
  });
}

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
