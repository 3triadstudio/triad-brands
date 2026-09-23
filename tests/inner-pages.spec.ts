import { expect, test } from "@playwright/test";

const SITE = "https://www.triadbrands.co.ke";

const decode = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const routes = [
  {
    path: "/",
    title: /Branded Merchandise & Printing in Nairobi \| Triad Brands/i,
    body: /Triad Brands|Branding|Browse the catalog/i,
  },
  {
    path: "/about",
    title: /About Triad Brands \| Branding Studio in Nairobi/i,
    body: /Triad Brands|Branding/i,
  },
  {
    path: "/solutions",
    title: /Branding, Print & Merchandise Services \| Triad Brands/i,
    body: /Make the brand|Branding/i,
  },
  {
    path: "/shop",
    title: /Shop Branded Merchandise & Promotional Items \| Triad Brands/i,
    body: /Branded merchandise|Browse the catalog/i,
  },
  {
    path: "/contact",
    title: /Contact Triad Brands \| Branding & Print Quotes in Nairobi/i,
    body: /Contact|Start the brief/i,
  },
  {
    path: "/category/apparel",
    title: /Apparel & Wearables in Nairobi \| Triad Brands/i,
    body: /Apparel/i,
  },
];

/**
 * These assertions read the server-rendered HTML rather than the hydrated DOM.
 * That is what a crawler indexes on first fetch, and it is the part the route
 * code owns — a published CMS document can still override the head later.
 */
for (const route of routes) {
  test(`${route.path} serves complete, unique SEO metadata`, async ({ request }) => {
    const response = await request.get(route.path);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();

    const title = decode(html.match(/<title[^>]*>(.*?)<\/title>/s)?.[1] ?? "");
    expect(title).toMatch(route.title);
    expect(title.length).toBeLessThanOrEqual(70);

    const descriptions = [
      ...html.matchAll(/<meta[^>]*name="description"[^>]*content="([^"]*)"/g),
    ].map((m) => decode(m[1]!));
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]!.length).toBeGreaterThanOrEqual(80);
    expect(descriptions[0]!.length).toBeLessThanOrEqual(160);

    // Exactly one canonical, pointing at this page and nothing else. A second
    // canonical (previously inherited from the root route) makes Google ignore
    // both.
    const canonicals = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/g)].map(
      (m) => m[1]!,
    );
    expect(canonicals).toEqual([`${SITE}${route.path}`]);

    expect(html).toMatch(route.body);
  });
}

test("every page renders exactly one h1", async ({ request }) => {
  for (const path of ["/", "/about", "/solutions", "/shop", "/contact", "/privacy-policy"]) {
    const html = await (await request.get(path)).text();
    const body = html.match(/<body[^>]*>(.*)<\/body>/s)?.[1] ?? html;
    expect(body.match(/<h1[\s>]/g) ?? [], `h1 count on ${path}`).toHaveLength(1);
  }
});

test("page titles and descriptions are unique across the site", async ({ request }) => {
  const seen = new Map<string, string>();
  for (const route of routes) {
    const html = await (await request.get(route.path)).text();
    const title = decode(html.match(/<title[^>]*>(.*?)<\/title>/s)?.[1] ?? "");
    const description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ?? "";
    const key = `${title}::${description}`;
    expect(seen.has(key), `${route.path} duplicates ${seen.get(key)}`).toBeFalsy();
    seen.set(key, route.path);
  }
});

test("the site ships structured data for the organisation and its pages", async ({ request }) => {
  const home = await (await request.get("/")).text();
  expect(home).toContain('"@type":"Organization"');
  expect(home).toContain('"@type":"WebSite"');
  expect(home).toContain('"@type":"ProfessionalService"');

  const contact = await (await request.get("/contact")).text();
  expect(contact).toContain('"@type":"FAQPage"');

  const category = await (await request.get("/category/apparel")).text();
  expect(category).toContain('"@type":"BreadcrumbList"');
});

test("the hydrated page keeps a single absolute canonical", async ({ page }) => {
  for (const path of ["/", "/about", "/shop"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    const href = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(href, `canonical on ${path}`).toMatch(/^https:\/\/www\.triadbrands\.co\.ke\//);
  }
});

test("shop catalog shows catalog content without crashing", async ({ page }) => {
  await page.goto("/shop");

  await expect(page.locator("body")).toContainText(/Branded merchandise|Browse the catalog|From/i);
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

test("contact page renders a working contact CTA", async ({ page }) => {
  await page.goto("/contact");

  // Contact is CMS-driven: whether it renders the built-in route or a published
  // document, it must always surface a way to start a conversation. The exact
  // markup (an inline mailto vs. the brief dialog) is left to the CMS content.
  await expect(page.locator("body")).toContainText(
    /Start the brief|Start a project|Tell us what you are building/i,
  );
  const contactAffordances = page.locator(
    'a[href^="mailto:"], a[href^="https://wa.me"], button:has-text("Start")',
  );
  expect(await contactAffordances.count()).toBeGreaterThan(0);
});

test("service and category pages render non-empty content", async ({ page }) => {
  await page.goto("/solutions");
  await expect(page.getByRole("heading", { name: /Make the brand/i })).toBeVisible();

  await page.goto("/category/apparel");
  await expect(page.getByRole("heading", { name: /Apparel & Wearables|Apparel/i })).toBeVisible();
  await expect(page.locator("text=No products found in this category").first()).not.toBeVisible();
});
