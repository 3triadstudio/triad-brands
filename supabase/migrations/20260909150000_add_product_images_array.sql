-- Add a persistent gallery for product detail pages.
ALTER TABLE public.products ADD COLUMN images text[] NOT NULL DEFAULT '{}';

-- Preserve existing catalog thumbnails as the first gallery image.
UPDATE public.products
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND cardinality(images) = 0;