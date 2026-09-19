CREATE TABLE public.page_content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL,
  revision bigint NOT NULL,
  document jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, revision)
);

GRANT SELECT, INSERT ON public.page_content_revisions TO authenticated;
GRANT ALL ON public.page_content_revisions TO service_role;
ALTER TABLE public.page_content_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read page revisions"
ON public.page_content_revisions FOR SELECT TO authenticated
USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins create page revisions"
ON public.page_content_revisions FOR INSERT TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE INDEX page_content_revisions_page_created_idx
ON public.page_content_revisions (page_id, created_at DESC);
