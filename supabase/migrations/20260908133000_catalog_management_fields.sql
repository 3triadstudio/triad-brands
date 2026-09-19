ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sale_price integer,
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';