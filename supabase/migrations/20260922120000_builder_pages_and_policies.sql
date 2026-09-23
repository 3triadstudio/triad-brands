-- The visual builder edits every public route, including the three policy
-- pages, so the page_id allow-list has to cover them.

ALTER TABLE public.page_content DROP CONSTRAINT IF EXISTS page_content_page_id_check;
ALTER TABLE public.page_content ADD CONSTRAINT page_content_page_id_check
  CHECK (page_id IN (
    'home', 'shop', 'solutions', 'about', 'contact', 'category', 'product',
    'work', 'services', 'studio', 'privacy', 'terms', 'cookies'
  ));

ALTER TABLE public.page_published_content DROP CONSTRAINT IF EXISTS page_published_content_page_id_check;
ALTER TABLE public.page_published_content ADD CONSTRAINT page_published_content_page_id_check
  CHECK (page_id IN (
    'home', 'shop', 'solutions', 'about', 'contact', 'category', 'product',
    'work', 'services', 'studio', 'privacy', 'terms', 'cookies'
  ));

-- Revisions are written on every publish; admins need to read their own history
-- back to restore from it.
DROP POLICY IF EXISTS "Admins read page revisions" ON public.page_content_revisions;
CREATE POLICY "Admins read page revisions"
ON public.page_content_revisions FOR SELECT TO authenticated
USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins write page revisions" ON public.page_content_revisions;
CREATE POLICY "Admins write page revisions"
ON public.page_content_revisions FOR INSERT TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'));
