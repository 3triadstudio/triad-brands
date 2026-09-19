-- Add backend-managed icon metadata for public social links.
ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS icon_key text NOT NULL DEFAULT 'globe';

UPDATE public.social_links
SET icon_key = CASE lower(label)
  WHEN 'instagram' THEN 'instagram'
  WHEN 'linkedin' THEN 'linkedin'
  WHEN 'x' THEN 'x'
  WHEN 'twitter' THEN 'twitter'
  WHEN 'facebook' THEN 'facebook'
  WHEN 'youtube' THEN 'youtube'
  ELSE 'globe'
END
WHERE icon_key = 'globe';

-- Keep the shop populated across every public catalog category.
INSERT INTO public.products (title, subtitle, category, badges, price_from, whatsapp_payload, featured, sort_order)
SELECT seed.title, seed.subtitle, seed.category, seed.badges, seed.price_from, seed.whatsapp_payload, seed.featured, seed.sort_order
FROM (VALUES
  ('Custom Branded Hoodie', 'Heavyweight fleece with embroidered or printed artwork', 'Apparel', ARRAY['Popular']::text[], 2800, 'Hello Triad Studio, I would like a quote for Custom Branded Hoodies.', true, 4),
  ('Branded Notebook Set', 'Hardcover notebooks and matching pens for teams and offices', 'Drinkware & Office', ARRAY['Office']::text[], 1200, 'Hello Triad Studio, I would like a quote for Branded Notebook Sets.', true, 5),
  ('Teardrop Event Flag', 'Full-colour outdoor flag with a stable display base', 'Event & Exhibition', ARRAY['Event']::text[], 9500, 'Hello Triad Studio, I would like a quote for Teardrop Event Flags.', true, 6),
  ('Branded Tote Bag', 'Reusable cotton tote for campaigns, gifting, and retail', 'Promotional Merchandise', ARRAY['New']::text[], 650, 'Hello Triad Studio, I would like a quote for Branded Tote Bags.', true, 7)
) AS seed(title, subtitle, category, badges, price_from, whatsapp_payload, featured, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.products existing WHERE existing.title = seed.title
);

-- Backfill the founders block into existing About drafts and publications without duplicating it.
DO $$
DECLARE
  founders jsonb := '{
    "id":"about_founders",
    "kind":"founders",
    "label":"The founders",
    "visible":true,
    "mobileVisible":true,
    "content":{
      "eyebrow":"The founders",
      "heading":"Three points of view. One standard.",
      "body":"Triad is shaped by three founders who stay close to the thinking, making, and delivery.",
      "founder_1_name":"Founder One",
      "founder_1_role":"Creative direction",
      "founder_1_bio":"Brand thinking and the point of view behind the work.",
      "founder_2_name":"Founder Two",
      "founder_2_role":"Design and digital",
      "founder_2_bio":"Systems and experiences that make the brand useful.",
      "founder_3_name":"Founder Three",
      "founder_3_role":"Production and delivery",
      "founder_3_bio":"The craft and operational detail that gets work into the world."
    },
    "items":[],
    "design":{}
  }'::jsonb;
BEGIN
  UPDATE public.page_content
  SET draft = jsonb_set(draft, '{blocks}', (draft->'blocks') || jsonb_build_array(founders)),
      published = jsonb_set(published, '{blocks}', (published->'blocks') || jsonb_build_array(founders)),
      draft_revision = draft_revision + 1,
      published_revision = published_revision + 1,
      published_at = now()
  WHERE page_id = 'about'
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(draft->'blocks') block
      WHERE block->>'id' = 'about_founders'
    );

  UPDATE public.page_published_content
  SET document = jsonb_set(document, '{blocks}', (document->'blocks') || jsonb_build_array(founders)),
      revision = revision + 1
  WHERE page_id = 'about'
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(document->'blocks') block
      WHERE block->>'id' = 'about_founders'
    );
END $$;
