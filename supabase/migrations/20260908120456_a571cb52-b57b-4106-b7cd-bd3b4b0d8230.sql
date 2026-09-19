
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Apparel',
  badges text[] NOT NULL DEFAULT '{}',
  price_from integer NOT NULL DEFAULT 0,
  image_url text,
  whatsapp_payload text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins read all products" ON public.products FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  heading text NOT NULL DEFAULT '',
  subheading text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.page_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;
GRANT ALL ON public.page_sections TO service_role;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sections are public" ON public.page_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage sections" ON public.page_sections FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER page_sections_updated_at BEFORE UPDATE ON public.page_sections FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eyebrow text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  subtext text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT 'Request Custom Quote',
  cta_href text NOT NULL DEFAULT '#quote',
  image_url text,
  overlay_opacity integer NOT NULL DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active slides are public" ON public.hero_slides FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins read all slides" ON public.hero_slides FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage slides" ON public.hero_slides FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.whatsapp_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  phone text NOT NULL,
  message text NOT NULL DEFAULT '',
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'whatsapp',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.whatsapp_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_leads TO authenticated;
GRANT ALL ON public.whatsapp_leads TO service_role;
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log an enquiry" ON public.whatsapp_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read enquiries" ON public.whatsapp_leads FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage enquiries" ON public.whatsapp_leads FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER whatsapp_leads_updated_at BEFORE UPDATE ON public.whatsapp_leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  label text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.click_events TO anon;
GRANT SELECT, INSERT ON public.click_events TO authenticated;
GRANT ALL ON public.click_events TO service_role;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record a click" ON public.click_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read clicks" ON public.click_events FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_slides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;

INSERT INTO public.page_sections (key, name, heading, subheading, sort_order) VALUES
 ('hero','Hero carousel','Elevate your corporate identity','In-house branding, print and merchandise in Nairobi.',1),
 ('featured','Featured solutions','Featured solutions','Our most requested branded items.',2),
 ('categories','Category grid','Shop by category','Everything we brand, in one place.',3),
 ('promo','Promo banner','Bulk order pricing','Talk to us about volume pricing for teams and events.',4),
 ('value_props','Value props','Why Triad','Quality over volume, always.',5)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.hero_slides (eyebrow, headline, subtext, cta_label, cta_href, overlay_opacity, sort_order) VALUES
 ('Corporate apparel & embroidery','Elevate your corporate identity','Nairobi-based embroidery and print, produced in-house with fast turnaround on team apparel of any size.','Request Custom Quote','#quote',60,1),
 ('Event & exhibition gear','Own the room at every event','Pull-up banners, teardrop flags, backdrops and podiums — printed, finished and delivered on schedule.','Request Custom Quote','#quote',60,2),
 ('Office essentials & branded gifting','Gifts your clients keep using','Notebooks, drinkware, pens and gift sets branded to spec, with bulk pricing across Kenya.','Request Custom Quote','#quote',60,3);

INSERT INTO public.products (title, subtitle, category, badges, price_from, whatsapp_payload, featured, sort_order) VALUES
 ('Custom Embroidered Polo','Comfortable fabric with vibrant logo print','Apparel','{"High-Density Embroidery","Screen Print"}',1500,'Hello Triad Studio, I would like a quote for Custom Embroidered Polos.',true,1),
 ('Pull-Up Banner Stand','Roll-up stand with full-colour print','Conference Equipment','{"Sublimation"}',6500,'Hello Triad Studio, I would like a quote for Pull-Up Banner Stands.',true,2),
 ('Laser-Engraved Mug','Durable engraving that will not fade','Drinkware & Office','{"UV Direct"}',850,'Hello Triad Studio, I would like a quote for Laser-Engraved Mugs.',true,3);

INSERT INTO public.site_settings (key, value) VALUES
 ('theme','{"primary_accent":"#ED1D2B","secondary_accent":"#FAA91C","bg_color":"#FCFCFA","ink_color":"#0E1331","card_border":"#E5E5E0"}'::jsonb),
 ('contacts','{"phone":"0700390157","whatsapp":"254700390157","email":"3.triadstudio@gmail.com"}'::jsonb),
 ('automation','{"auto_reply_enabled":true,"auto_reply_message":"Thanks for reaching out to Triad Studio! We have received your enquiry and will reply with a quote shortly.","out_of_office_enabled":false,"out_of_office_message":"We are currently closed. Our team replies from 8am to 6pm EAT."}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
