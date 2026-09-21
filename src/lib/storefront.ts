import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getDefaultPageDocument,
  normalizePageDocument,
  type PageDocument,
  type PageId,
} from "@/lib/page-editor";

export interface ThemeSettings {
  primary_accent: string;
  secondary_accent: string;
  bg_color: string;
  ink_color: string;
  card_border: string;
}

export interface ContactSettings {
  phone: string;
  whatsapp: string;
  email: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  target: "_self" | "_blank";
}

export interface SeoSettings {
  title: string;
  description: string;
  copyright: string;
  studio: string;
}

export interface SocialSettings {
  instagram: string;
  linkedin: string;
  twitter: string;
}

export interface PublicSocialLink {
  id: string;
  label: string;
  href: string;
  icon_key: string;
  sort_order: number;
  active: boolean;
}

export interface FooterSettings {
  eyebrow: string;
  headline: string;
  cta_label: string;
}

export interface CookieBannerSettings {
  enabled: boolean;
  heading: string;
  description: string;
  acceptLabel: string;
  declineLabel: string;
  policyLabel: string;
}

export interface BrandingSettings {
  logo_url: string;
  favicon_url: string;
}

export interface AutomationSettings {
  auto_reply_enabled: boolean;
  auto_reply_message: string;
  out_of_office_enabled: boolean;
  out_of_office_message: string;
}

export const defaultTheme: ThemeSettings = {
  primary_accent: "#ED1D2B",
  secondary_accent: "#FAA91C",
  bg_color: "#FCFCFA",
  ink_color: "#0E1331",
  card_border: "#E5E5E0",
};

export const defaultContacts: ContactSettings = {
  phone: "0700390157",
  whatsapp: "254700390157",
  email: "3.triadstudio@gmail.com",
};

export const defaultNavigation: NavigationItem[] = [
  { label: "About", href: "/about", target: "_self" },
  { label: "Solutions", href: "/solutions", target: "_self" },
  { label: "Shop", href: "/shop", target: "_self" },
  { label: "Contact", href: "/contact", target: "_self" },
];

export const defaultSeo: SeoSettings = {
  title: "Triad Brands — We brand. You stand out.",
  description: "Branding, print, digital design, and branded merchandise from Nairobi.",
  copyright: "© 2026 Triad Brands",
  studio: "Triad Brands, Nairobi",
};

export const defaultSocials: SocialSettings = {
  instagram: "https://instagram.com/triadstudio",
  linkedin: "https://linkedin.com/company/triadstudio",
  twitter: "https://x.com/triadstudio",
};

export const defaultFooter: FooterSettings = {
  eyebrow: "Start a project",
  headline: "Let's make it\nwork together.",
  cta_label: "Start the brief",
};

export const defaultBranding: BrandingSettings = {
  logo_url: "",
  favicon_url: "/favicon.png",
};

export interface DbProduct {
  id: string;
  title: string;
  sku: string;
  subtitle: string;
  description: string;
  category: string;
  badges: string[];
  price_from: number;
  sale_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  images: string[];
  whatsapp_payload: string;
  featured: boolean;
  active: boolean;
  sort_order: number;
}

export interface DbSection {
  id: string;
  key: string;
  name: string;
  heading: string;
  subheading: string;
  is_visible: boolean;
  sort_order: number;
}

export interface DbSlide {
  id: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  cta_label: string;
  cta_href: string;
  image_url: string | null;
  overlay_opacity: number;
  active: boolean;
  sort_order: number;
}

export interface DbProject {
  id: string;
  slug: string;
  title: string;
  label: string;
  category: string;
  meta: string;
  year: string;
  client: string;
  services: string[];
  summary: string;
  body: string[];
  image_url: string | null;
  sort_order: number;
  published: boolean;
}

export interface DbService {
  id: string;
  tag: string;
  name: string;
  detail: string;
  deliverables: string[];
  sort_order: number;
  active: boolean;
  categoryHref?: string;
}

function deriveServiceCategoryHref(serviceName: string) {
  const normalized = serviceName.toLowerCase();
  if (/(identity|brand)/.test(normalized)) return "/category/apparel";
  if (/(digital|direction|screen)/.test(normalized)) return "/category/drinkware";
  if (/(print|large format|event|conference|signage)/.test(normalized)) return "/category/event";
  if (/(merch|promo|gift|rollout)/.test(normalized)) return "/category/promo";
  return "/category/promo";
}

async function fetchSettings() {
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw new Error(error.message);
  const map = new Map((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
  const rawTheme = (map.get("theme") as Record<string, string> | undefined) ?? {};
  const rawContacts =
    (map.get("contacts") as Partial<ContactSettings> | undefined) ??
    (map.get("contact") as Partial<ContactSettings> | undefined) ??
    {};
  const rawNavigation = map.get("navigation");
  const rawSeo = (map.get("seo") as Partial<SeoSettings> | undefined) ?? {};
  const rawSocials = (map.get("socials") as Partial<SocialSettings> | undefined) ?? {};
  const rawFooter = (map.get("footer") as Partial<FooterSettings> | undefined) ?? {};
  const rawCookieBanner =
    (map.get("cookie_banner") as Partial<CookieBannerSettings> | undefined) ?? {};
  const rawBranding = (map.get("branding") as Partial<BrandingSettings> | undefined) ?? {};
  const storedNavigation = Array.isArray(rawNavigation) ? (rawNavigation as NavigationItem[]) : [];
  const policyLinks = defaultNavigation.filter((link) =>
    ["/privacy-policy", "/terms", "/cookies"].includes(link.href),
  );
  const navigation = Array.isArray(rawNavigation)
    ? [
        ...storedNavigation,
        ...policyLinks.filter(
          (policyLink) => !storedNavigation.some((link) => link.href === policyLink.href),
        ),
      ]
    : defaultNavigation;
  const socials = Object.fromEntries(
    Object.entries(defaultSocials).map(([key, fallback]) => [
      key,
      rawSocials[key as keyof SocialSettings] || fallback,
    ]),
  ) as SocialSettings;
  return {
    theme: {
      ...defaultTheme,
      primary_accent: rawTheme["primary_accent"] ?? rawTheme["red"],
      secondary_accent: rawTheme["secondary_accent"] ?? rawTheme["amber"],
      bg_color: rawTheme["bg_color"] ?? rawTheme["paper"],
      ink_color: rawTheme["ink_color"] ?? rawTheme["navy"],
      card_border: rawTheme["card_border"],
    } as ThemeSettings,
    contacts: { ...defaultContacts, ...rawContacts } as ContactSettings,
    navigation,
    seo: { ...defaultSeo, ...rawSeo } as SeoSettings,
    socials,
    footer: { ...defaultFooter, ...rawFooter } as FooterSettings,
    cookie_banner: {
      enabled: true,
      heading: "We use cookies to keep the site smooth and useful.",
      description:
        "We use essential cookies for the site to function and optional preferences to improve your experience. You can change your choice at any time.",
      acceptLabel: "Accept cookies",
      declineLabel: "Only essentials",
      policyLabel: "Cookie policy",
      ...rawCookieBanner,
    } as CookieBannerSettings,
    branding: { ...defaultBranding, ...rawBranding } as BrandingSettings,
  };
}

export function useSiteSettings() {
  return useQuery({ queryKey: ["site-settings"], queryFn: fetchSettings, staleTime: 30_000 });
}

export function useSocialLinks() {
  return useQuery({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("id, label, href, icon_key, sort_order, active")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as PublicSocialLink[];
    },
  });
}

export function useSections() {
  return useQuery({
    queryKey: ["page-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as DbSection[];
    },
  });
}

export function usePublishedPage(pageId: PageId) {
  return useQuery<PageDocument | null>({
    queryKey: ["published-page-document", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_published_content")
        .select("document")
        .eq("page_id", pageId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data?.document) return null;
      return normalizePageDocument(data.document, getDefaultPageDocument(pageId));
    },
    staleTime: 30_000,
  });
}

export function useHeroSlides() {
  return useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as DbSlide[];
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["storefront-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as DbProduct[]).map((product) => ({
        ...product,
        images: product.images?.length ? product.images : product.image_url ? [product.image_url] : [],
      }));
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["storefront-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as DbProject[];
    },
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["storefront-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      return ((data ?? []) as DbService[]).map((service) => ({
        ...service,
        categoryHref:
          service.categoryHref ?? deriveServiceCategoryHref(service.tag || service.name),
      }));
    },
  });
}

/** Live-sync: refetch storefront content whenever the CMS changes it. */
export function useStorefrontRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("storefront-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () =>
        qc.invalidateQueries({ queryKey: ["site-settings"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "page_sections" }, () =>
        qc.invalidateQueries({ queryKey: ["page-sections"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_slides" }, () =>
        qc.invalidateQueries({ queryKey: ["hero-slides"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () =>
        qc.invalidateQueries({ queryKey: ["storefront-products"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () =>
        qc.invalidateQueries({ queryKey: ["storefront-projects"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () =>
        qc.invalidateQueries({ queryKey: ["storefront-services"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "page_published_content" },
        () => qc.invalidateQueries({ queryKey: ["published-page-document"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

/** Applies CMS theme colours to CSS variables at runtime. */
export function useLiveTheme() {
  const { data } = useSiteSettings();
  useEffect(() => {
    if (!data?.theme || typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--cms-accent", data.theme.primary_accent);
    root.style.setProperty("--cms-accent-2", data.theme.secondary_accent);
    root.style.setProperty("--cms-paper", data.theme.bg_color);
    root.style.setProperty("--cms-ink", data.theme.ink_color);
    root.style.setProperty("--cms-border", data.theme.card_border);
  }, [data]);
  return data;
}

export async function logClick(input: {
  kind: "whatsapp" | "tel" | "email" | "admin";
  label?: string;
  category?: string;
  product_id?: string | null;
}) {
  try {
    await supabase.from("click_events").insert({
      kind: input.kind,
      label: input.label ?? "",
      category: input.category ?? "",
      product_id: input.product_id ?? null,
    } as never);
  } catch {
    /* analytics must never block the user */
  }
}

export async function logAdminInteraction(input: { label: string; category?: string }) {
  await logClick({
    kind: "admin",
    label: input.label,
    category: input.category ?? "dashboard",
  });
}

export async function logWhatsappLead(input: {
  phone: string;
  name?: string;
  message?: string;
  product_id?: string | null;
  product_title?: string;
}) {
  try {
    await supabase.from("whatsapp_leads").insert({
      phone: input.phone,
      name: input.name ?? "",
      message: input.message ?? "",
      product_id: input.product_id ?? null,
      product_title: input.product_title ?? "",
    } as never);
  } catch {
    /* ignore */
  }
}

export function waLink(whatsapp: string, text: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
