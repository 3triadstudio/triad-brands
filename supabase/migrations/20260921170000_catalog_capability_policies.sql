CREATE OR REPLACE FUNCTION public.has_capability(_user_id uuid, _capability text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'admin'
        OR (
          jsonb_array_length(permissions) > 0
          AND permissions ? _capability
        )
        OR (
          jsonb_array_length(permissions) = 0
          AND (
            (_capability = 'catalog' AND role = 'editor')
            OR (_capability = 'content' AND role = 'editor')
            OR (_capability = 'leads' AND role = 'editor')
            OR (_capability = 'projects' AND role IN ('editor', 'author'))
            OR (_capability = 'settings' AND role = 'editor')
            OR (_capability = 'dashboard' AND role IN ('editor', 'author', 'contributor'))
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_capability(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_capability(uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins read all products" ON public.products;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;

CREATE POLICY "Catalog managers read all products"
ON public.products FOR SELECT TO authenticated
USING ((SELECT public.has_capability(auth.uid(), 'catalog')));

CREATE POLICY "Catalog managers manage products"
ON public.products FOR ALL TO authenticated
USING ((SELECT public.has_capability(auth.uid(), 'catalog')))
WITH CHECK ((SELECT public.has_capability(auth.uid(), 'catalog')));

DROP POLICY IF EXISTS "Admins can upload site assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site assets" ON storage.objects;

CREATE POLICY "Catalog managers can upload site assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND (SELECT public.has_capability(auth.uid(), 'catalog'))
);

CREATE POLICY "Catalog managers can update site assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (SELECT public.has_capability(auth.uid(), 'catalog'))
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND (SELECT public.has_capability(auth.uid(), 'catalog'))
);

CREATE POLICY "Catalog managers can delete site assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (SELECT public.has_capability(auth.uid(), 'catalog'))
);