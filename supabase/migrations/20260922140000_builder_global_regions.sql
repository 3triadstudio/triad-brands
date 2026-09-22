-- Header and footer become editable builder regions. They are stored like any
-- other page document; the site keeps using its built-in markup until one is
-- published, so this is additive and reversible (delete the row to revert).

ALTER TABLE public.page_content DROP CONSTRAINT IF EXISTS page_content_page_id_check;
ALTER TABLE public.page_content ADD CONSTRAINT page_content_page_id_check
  CHECK (page_id IN (
    'header', 'footer',
    'home', 'shop', 'solutions', 'about', 'contact', 'category', 'product',
    'work', 'services', 'studio', 'privacy', 'terms', 'cookies'
  ));

ALTER TABLE public.page_published_content DROP CONSTRAINT IF EXISTS page_published_content_page_id_check;
ALTER TABLE public.page_published_content ADD CONSTRAINT page_published_content_page_id_check
  CHECK (page_id IN (
    'header', 'footer',
    'home', 'shop', 'solutions', 'about', 'contact', 'category', 'product',
    'work', 'services', 'studio', 'privacy', 'terms', 'cookies'
  ));
