-- Keep the editable dashboard navigation aligned with the public header contract.
INSERT INTO public.site_settings (key, value)
VALUES (
  'navigation',
  '[
    {"label":"About","href":"/about","target":"_self"},
    {"label":"Solutions","href":"/solutions","target":"_self"},
    {"label":"Shop","href":"/shop","target":"_self"},
    {"label":"Contact","href":"/contact","target":"_self"}
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;