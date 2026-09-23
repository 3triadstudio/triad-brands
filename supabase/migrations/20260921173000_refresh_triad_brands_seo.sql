UPDATE public.page_published_content
SET document = replace(document::text, 'Triad Studio', 'Triad Brands')::jsonb,
    published_at = now()
WHERE document::text LIKE '%Triad Studio%';

UPDATE public.site_settings
SET value = replace(value::text, 'Triad Studio', 'Triad Brands')::jsonb,
    updated_at = now()
WHERE value::text LIKE '%Triad Studio%';