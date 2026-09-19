CREATE TABLE public.saved_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_sections TO authenticated;
GRANT ALL ON public.saved_sections TO service_role;
ALTER TABLE public.saved_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage saved sections"
ON public.saved_sections FOR ALL TO authenticated
USING (public.has_role((select auth.uid()), 'admin'))
WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE TRIGGER saved_sections_updated_at
BEFORE UPDATE ON public.saved_sections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
