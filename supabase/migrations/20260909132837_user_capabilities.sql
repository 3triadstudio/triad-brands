ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_roles.permissions IS
  'Explicit dashboard capabilities granted to this user. An empty array uses the role defaults.';