-- Add the contact route to the editable public header navigation.
UPDATE public.site_settings
SET value = value || '[{"label":"Contact","href":"/contact","target":"_self"}]'::jsonb
WHERE key = 'navigation'
  AND jsonb_typeof(value) = 'array'
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(value) AS link
    WHERE link->>'href' = '/contact'
  );