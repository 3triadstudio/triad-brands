
-- roles
CREATE TYPE public.app_role AS ENUM ('admin','editor');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  service text,
  starting_point text,
  budget text,
  timeline text,
  details text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update leads" ON public.leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  label text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Branding',
  meta text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  client text NOT NULL DEFAULT '',
  services text[] NOT NULL DEFAULT '{}',
  summary text NOT NULL DEFAULT '',
  body text[] NOT NULL DEFAULT '{}',
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published projects are public" ON public.projects FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins read all projects" ON public.projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text NOT NULL DEFAULT '',
  name text NOT NULL,
  detail text NOT NULL DEFAULT '',
  deliverables text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active services are public" ON public.services FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins read all services" ON public.services FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- social links
CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active socials are public" ON public.social_links FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins read all socials" ON public.social_links FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage socials" ON public.social_links FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER social_links_updated_at BEFORE UPDATE ON public.social_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- site settings
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed services
INSERT INTO public.services (tag, name, detail, deliverables, sort_order) VALUES
('Identity','Brand Identity','Naming direction, logo systems, visual identity, guidelines','{"Logo system","Typography & colour","Brand guidelines","Naming direction"}',1),
('Screen','Digital Design','Websites, landing pages, social systems, presentations','{"Websites","Landing pages","Social templates","Decks"}',2),
('Paper','Print Production','Stationery, brochures, catalogues, packaging, finishing','{"Stationery","Brochures","Catalogues","Packaging"}',3),
('Scale','Large Format','Banners, backdrops, signage, roll-ups, vehicle graphics','{"Banners","Backdrops","Signage","Vehicle graphics"}',4),
('Objects','Branded Merch','Apparel, drinkware, corporate gifting, promotional items','{"Apparel","Drinkware","Gifting","Promo items"}',5),
('Events','Event Collateral','Conference kits, badges, wayfinding, programmes','{"Delegate kits","Badges","Wayfinding","Programmes"}',6),
('Direction','Art Direction','Campaign concepts, photography direction, oversight','{"Campaign concepts","Photo direction","Styling","Oversight"}',7),
('Delivery','Brand Rollout','Templates, asset libraries, supplier coordination','{"Templates","Asset libraries","Supplier coordination","Training"}',8);

-- seed projects
INSERT INTO public.projects (slug, title, label, category, meta, year, client, services, summary, body, sort_order) VALUES
('professional-services-stationery','Stationery system for a professional services firm','Identity','Branding','Brand identity · Print','2025','Confidential — legal & advisory','{"Brand Identity","Print Production"}','A restrained identity and stationery system built to read as considered on paper first, screen second.','{"The firm had grown past its original mark and needed an identity that could carry weight in a boardroom without shouting. We built a typographic system with a single graphic device, then designed the full stationery suite around it.","Everything was proofed and produced under our supervision — paper stock, ink density and finishing were selected as part of the design, not after it."}',1),
('conference-signage','Signage and wayfinding for a two-day conference','Environment','Print','Large format · Event','2025','Regional industry summit','{"Large Format","Event Collateral"}','A wayfinding and stage environment designed, produced and installed inside a three-week window.','{"Two floors, six rooms and a thousand delegates who needed to find the right session without asking anyone. We designed a colour-coded wayfinding system, delegate collateral and the main stage backdrop as one family.","Because production ran in-house, late programme changes were reprinted overnight rather than renegotiated."}',2),
('retail-merch-capsule','Merchandise capsule for a retail launch','Objects','Digital','Merchandise · Production','2024','Retail launch, Nairobi','{"Branded Merch","Art Direction"}','A tight capsule of apparel and objects that extended a young brand into physical space.','{"Rather than stamping a logo on a catalogue of items, we picked a small set of objects people would actually keep and designed each one properly — fabric weight, print method and packaging included.","The capsule sold through the launch weekend and became the template for the brand''s ongoing gifting programme."}',3);

-- seed socials
INSERT INTO public.social_links (label, href, sort_order) VALUES
('Instagram','https://instagram.com/triadstudio',1),
('LinkedIn','https://linkedin.com/company/triadstudio',2),
('Behance','https://behance.net/triadstudio',3),
('X','https://x.com/triadstudio',4);

-- seed settings
INSERT INTO public.site_settings (key, value) VALUES
('hero','{"eyebrow":"Nairobi · Independent creative studio","headline":"We brand. You stand out.","highlight":"stand out","sub":"A full-service creative studio bringing branding, digital design, print production and branded merchandise under one roof.","cta":"Start a project"}'::jsonb),
('theme','{"navy":"#0E1331","red":"#ED1D2B","amber":"#FAA91C","paper":"#FCFCFA"}'::jsonb);
