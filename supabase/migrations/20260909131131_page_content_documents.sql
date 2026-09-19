CREATE TABLE public.page_content (
  page_id text PRIMARY KEY CHECK (page_id IN ('home', 'services', 'contact', 'work', 'studio')),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  published jsonb NOT NULL DEFAULT '{}'::jsonb,
  draft_revision bigint NOT NULL DEFAULT 1,
  published_revision bigint NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.page_content TO authenticated;
GRANT ALL ON public.page_content TO service_role;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read page documents"
ON public.page_content FOR SELECT TO authenticated
USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins create page documents"
ON public.page_content FOR INSERT TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins update page documents"
ON public.page_content FOR UPDATE TO authenticated
USING (public.has_role((select auth.uid()), 'admin'))
WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE TRIGGER page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.page_published_content (
  page_id text PRIMARY KEY CHECK (page_id IN ('home', 'services', 'contact', 'work', 'studio')),
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision bigint NOT NULL DEFAULT 0,
  published_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_published_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.page_published_content TO authenticated;
GRANT ALL ON public.page_published_content TO service_role;
ALTER TABLE public.page_published_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published page documents are public"
ON public.page_published_content FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage published page documents"
ON public.page_published_content FOR ALL TO authenticated
USING (public.has_role((select auth.uid()), 'admin'))
WITH CHECK (public.has_role((select auth.uid()), 'admin'));

INSERT INTO public.page_content (page_id, draft, published)
VALUES ('home', '{"version":1,"pageId":"home","title":"Landing Page","description":"Triad Studio storefront landing page","blocks":[{"id":"hero","kind":"hero","label":"Hero Carousel","visible":true,"mobileVisible":true,"content":{},"design":{}},{"id":"featured","kind":"featured","label":"Featured Solutions","visible":true,"mobileVisible":true,"content":{},"design":{}},{"id":"categories","kind":"categories","label":"Category Grid","visible":true,"mobileVisible":true,"content":{},"design":{}},{"id":"promo","kind":"promo","label":"Promo Banner","visible":true,"mobileVisible":true,"content":{},"design":{}},{"id":"value_props","kind":"value_props","label":"Value Props","visible":true,"mobileVisible":true,"content":{},"design":{}}],"seo":{"title":"Triad Studio — We brand. You stand out.","description":"Branding, print, digital design, and branded merchandise from Nairobi.","canonical":"/"}}'::jsonb, '{"version":1,"pageId":"home","title":"Landing Page","description":"Triad Studio storefront landing page","blocks":[{"id":"hero","kind":"hero","label":"Hero Carousel","visible":true,"mobileVisible":true,"content":{},"design":{}},{"id":"featured","kind":"featured","label":"Featured Solutions","visible":true,"mobileVisible":true,"content":{},"design":{}},{"id":"categories","kind":"categories","label":"Category Grid","visible":true,"mobileVisible":true,"content":{},"design":{}}],"seo":{"title":"Triad Studio — We brand. You stand out.","description":"Branding, print, digital design, and branded merchandise from Nairobi.","canonical":"/"}}'::jsonb)
ON CONFLICT (page_id) DO NOTHING;

INSERT INTO public.page_published_content (page_id, document, revision)
SELECT page_id, published, published_revision
FROM public.page_content
ON CONFLICT (page_id) DO NOTHING;
