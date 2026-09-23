-- Remove the name/label uses of "Studio" from the published footer region.
--
-- The footer is a builder region stored in the database, so updating
-- src/lib/builder/regions.ts only changes NEW regions — the live row keeps its
-- old labels until patched here. Only the standalone "Studio" eyebrow value and
-- the "About the studio" link label are touched; the descriptive lowercase
-- "a Nairobi branding studio" sentence is deliberately left intact.

UPDATE public.page_published_content
SET document = replace(
      replace(document::text, '"Studio"', '"Company"'),
      'About the studio',
      'About us'
    )::jsonb,
    published_at = now()
WHERE page_id = 'footer'
  AND (document::text LIKE '%"Studio"%' OR document::text LIKE '%About the studio%');

UPDATE public.page_content
SET draft = replace(
      replace(draft::text, '"Studio"', '"Company"'),
      'About the studio',
      'About us'
    )::jsonb,
    published = replace(
      replace(published::text, '"Studio"', '"Company"'),
      'About the studio',
      'About us'
    )::jsonb,
    updated_at = now()
WHERE page_id = 'footer'
  AND (
    draft::text LIKE '%"Studio"%' OR draft::text LIKE '%About the studio%'
    OR published::text LIKE '%"Studio"%' OR published::text LIKE '%About the studio%'
  );
