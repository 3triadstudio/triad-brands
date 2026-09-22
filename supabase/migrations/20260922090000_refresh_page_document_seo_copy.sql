-- Refresh the SEO block of every stored page document (draft and published) to
-- the copy defined in src/lib/seo.ts `pageCopy`.
--
-- Titles and descriptions in the CMS still carried the pre-rebrand placeholders
-- ("Shop — Triad Brands", "Branded merchandise by Triad Brands.") and relative
-- canonicals. Because PublishedPage writes document.seo over the route head,
-- those stale values are what search engines actually saw.
--
-- Only the `seo` object is touched. Block content, layout, visibility and
-- revisions are left exactly as the Page Builder has them.

CREATE TEMP TABLE _page_seo (
  page_id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  canonical text NOT NULL
) ON COMMIT DROP;

INSERT INTO _page_seo (page_id, title, description, canonical) VALUES
  ('home',
   'Branded Merchandise & Printing in Nairobi | Triad Brands',
   'Custom branded apparel, event branding, corporate gifts and print, designed and produced in our Nairobi workshop with bulk pricing across Kenya.',
   'https://www.triadbrands.co.ke/'),
  ('solutions',
   'Branding, Print & Merchandise Services | Triad Brands',
   'Brand identity, digital design, print production, large format and branded merchandise from one Nairobi studio — designed, produced and delivered in house.',
   'https://www.triadbrands.co.ke/solutions'),
  ('services',
   'Branding, Print & Merchandise Services | Triad Brands',
   'Brand identity, digital design, print production, large format and branded merchandise from one Nairobi studio — designed, produced and delivered in house.',
   'https://www.triadbrands.co.ke/solutions'),
  ('shop',
   'Shop Branded Merchandise & Promotional Items | Triad Brands',
   'Browse branded apparel, drinkware, event gear and corporate gifts with live KES pricing. Order custom promotional items from our Nairobi workshop.',
   'https://www.triadbrands.co.ke/shop'),
  ('about',
   'About Triad Brands | Branding Studio in Nairobi',
   'Triad Brands is an independent Nairobi branding studio. We design brand identities and produce the print, signage and merchandise that carry them.',
   'https://www.triadbrands.co.ke/about'),
  ('studio',
   'About Triad Brands | Branding Studio in Nairobi',
   'Triad Brands is an independent Nairobi branding studio. We design brand identities and produce the print, signage and merchandise that carry them.',
   'https://www.triadbrands.co.ke/about'),
  ('contact',
   'Contact Triad Brands | Branding & Print Quotes in Nairobi',
   'Request a quote for branding, printing or branded merchandise in Nairobi. Send a short brief and the studio replies with a practical next step.',
   'https://www.triadbrands.co.ke/contact'),
  ('work',
   'Selected Work | Branding & Print Projects | Triad Brands',
   'Selected branding, print, event and merchandise projects delivered by Triad Brands for clients in Nairobi and across Kenya.',
   'https://www.triadbrands.co.ke/work'),
  ('privacy',
   'Privacy Policy | Triad Brands',
   'How Triad Brands collects, uses and protects personal information submitted through our website, project briefs and WhatsApp enquiries.',
   'https://www.triadbrands.co.ke/privacy-policy'),
  ('terms',
   'Terms of Use | Triad Brands',
   'The terms that apply when you use the Triad Brands website, request a quote, or place an order for branding, print or branded merchandise.',
   'https://www.triadbrands.co.ke/terms'),
  ('cookies',
   'Cookie Policy | Triad Brands',
   'Which cookies the Triad Brands website sets, what each one is used for, and how to change your cookie preferences at any time.',
   'https://www.triadbrands.co.ke/cookies');

-- Category and product documents back dynamic routes: clearing the stored
-- canonical lets each slug keep the self-referencing canonical its route sets,
-- instead of collapsing every product onto /product.
UPDATE public.page_published_content
SET document = jsonb_set(
      document,
      '{seo,canonical}',
      '""'::jsonb,
      true
    ),
    published_at = now()
WHERE page_id IN ('category', 'product');

UPDATE public.page_published_content AS p
SET document = p.document
      || jsonb_build_object(
           'seo',
           COALESCE(p.document -> 'seo', '{}'::jsonb)
             || jsonb_build_object(
                  'title', s.title,
                  'description', s.description,
                  'canonical', s.canonical
                )
         ),
    published_at = now()
FROM _page_seo AS s
WHERE p.page_id = s.page_id;

UPDATE public.page_content AS c
SET draft = c.draft
      || jsonb_build_object(
           'seo',
           COALESCE(c.draft -> 'seo', '{}'::jsonb)
             || jsonb_build_object(
                  'title', s.title,
                  'description', s.description,
                  'canonical', s.canonical
                )
         ),
    published = CASE
      WHEN c.published IS NULL OR c.published = '{}'::jsonb THEN c.published
      ELSE c.published
             || jsonb_build_object(
                  'seo',
                  COALESCE(c.published -> 'seo', '{}'::jsonb)
                    || jsonb_build_object(
                         'title', s.title,
                         'description', s.description,
                         'canonical', s.canonical
                       )
                )
    END
FROM _page_seo AS s
WHERE c.page_id = s.page_id;
