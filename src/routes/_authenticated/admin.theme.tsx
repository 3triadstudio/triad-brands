import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Image as ImageIcon,
  Mail,
  Palette,
  Phone,
  Save,
  Smartphone,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { getSettings, saveSetting, uploadSiteAsset } from "@/lib/cms.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminError,
  AdminLoading,
  AdminPage,
  Panel,
  PanelHeading,
  adminInput,
} from "@/components/admin/ui";
import { defaultNavigation } from "@/lib/storefront";

export const Route = createFileRoute("/_authenticated/admin/theme")({ component: ThemeStudio });

type Theme = { navy: string; red: string; amber: string; paper: string };
type Contact = { phone: string; whatsapp: string; email: string };
type LinkItem = { label: string; href: string; target: "_self" | "_blank" };
type Seo = { title: string; description: string; copyright: string; studio: string };
type Socials = { instagram: string; linkedin: string; twitter: string };
type Footer = { eyebrow: string; headline: string; cta_label: string };
type CookieBannerConfig = {
  enabled: boolean;
  heading: string;
  description: string;
  acceptLabel: string;
  declineLabel: string;
  policyLabel: string;
};
type Branding = { logo_url: string; favicon_url: string };

const defaultTheme: Theme = { navy: "#0E1331", red: "#ED1D2B", amber: "#FAA91C", paper: "#FCFCFA" };
const defaultContact: Contact = {
  phone: "0700390157",
  whatsapp: "254700390157",
  email: "3.triadstudio@gmail.com",
};
const defaultLinks: LinkItem[] = [...defaultNavigation];
const defaultSeo: Seo = {
  title: "Triad Studio — We brand. You stand out.",
  description: "Branding, print, digital design, and branded merchandise from Nairobi.",
  copyright: "© 2026 Triad Studio",
  studio: "Triad Studio, Nairobi",
};
const defaultSocials: Socials = { instagram: "", linkedin: "", twitter: "" };
const defaultFooter: Footer = {
  eyebrow: "Start a project",
  headline: "Let's make it\nwork together.",
  cta_label: "Start the brief",
};
const defaultCookieBanner: CookieBannerConfig = {
  enabled: true,
  heading: "We use cookies to keep the site smooth and useful.",
  description:
    "We use essential cookies for the site to function and optional preferences to improve your experience. You can change your choice at any time.",
  acceptLabel: "Accept cookies",
  declineLabel: "Only essentials",
  policyLabel: "Cookie policy",
};
const defaultBranding: Branding = { logo_url: "", favicon_url: "/favicon.png" };

function ThemeStudio() {
  const get = useServerFn(getSettings);
  const save = useServerFn(saveSetting);
  const upload = useServerFn(uploadSiteAsset);
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: () => get({}) });
  const [theme, setTheme] = useState(defaultTheme);
  const [contact, setContact] = useState(defaultContact);
  const [links, setLinks] = useState(defaultLinks);
  const [seo, setSeo] = useState(defaultSeo);
  const [socials, setSocials] = useState(defaultSocials);
  const [footer, setFooter] = useState(defaultFooter);
  const [cookieBanner, setCookieBanner] = useState(defaultCookieBanner);
  const [branding, setBranding] = useState(defaultBranding);
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);

  useEffect(() => {
    if (!settings.data) return;
    const data = settings.data as Record<string, unknown>;
    setTheme({ ...defaultTheme, ...((data["theme"] ?? {}) as Partial<Theme>) });
    setContact({
      ...defaultContact,
      ...((data["contacts"] ?? data["contact"] ?? {}) as Partial<Contact>),
    });
    setLinks(Array.isArray(data["navigation"]) ? (data["navigation"] as LinkItem[]) : defaultLinks);
    setSeo({ ...defaultSeo, ...((data["seo"] ?? {}) as Partial<Seo>) });
    setSocials({ ...defaultSocials, ...((data["socials"] ?? {}) as Partial<Socials>) });
    setFooter({ ...defaultFooter, ...((data["footer"] ?? {}) as Partial<Footer>) });
    setCookieBanner({
      ...defaultCookieBanner,
      ...((data["cookie_banner"] ?? {}) as Partial<CookieBannerConfig>),
    });
    setBranding({ ...defaultBranding, ...((data["branding"] ?? {}) as Partial<Branding>) });
  }, [settings.data]);

  useEffect(() => {
    const channel = supabase
      .channel("cms-settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      })
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [queryClient]);

  const publish = useMutation({
    mutationFn: async () => {
      await Promise.all([
        save({ data: { key: "theme", value: theme } }),
        save({ data: { key: "contacts", value: contact } }),
        save({ data: { key: "navigation", value: links } }),
        save({ data: { key: "seo", value: seo } }),
        save({ data: { key: "socials", value: socials } }),
        save({ data: { key: "footer", value: footer } }),
        save({ data: { key: "cookie_banner", value: cookieBanner } }),
        save({ data: { key: "branding", value: branding } }),
      ]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Site settings published");
    },
    onError: () => toast.error("Could not save site settings"),
  });

  async function uploadBrandAsset(kind: "logo" | "favicon", file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be smaller than 5 MB");
      return;
    }
    setUploading(kind);
    try {
      const base64 = await fileToBase64(file);
      const { publicUrl } = await upload({
        data: { kind, filename: file.name, contentType: file.type, base64 },
      });
      const next = { ...branding, [kind === "logo" ? "logo_url" : "favicon_url"]: publicUrl };
      setBranding(next);
      await save({ data: { key: "branding", value: next } });
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(`${kind === "logo" ? "Logo" : "Favicon"} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload asset");
    } finally {
      setUploading(null);
    }
  }

  return (
    <AdminPage
      eyebrow="Theme & global styling"
      title="Site settings, under one roof."
      description="Control branding, contact routes, navigation, social links, footer metadata, and SEO without touching React code."
      action={
        <button
          type="button"
          onClick={() => publish.mutate()}
          disabled={settings.isPending || publish.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {publish.isPending ? "Publishing…" : "Publish changes"}
        </button>
      }
    >
      {settings.isPending ? <AdminLoading label="Loading site settings" /> : null}
      {settings.isError ? (
        <AdminError
          detail="Site settings could not be loaded."
          onRetry={() => void settings.refetch()}
        />
      ) : null}
      {!settings.isPending && !settings.isError ? (
        <>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
            <Panel>
              <PanelHeading
                icon={Palette}
                title="Live brand tokens"
                detail="Root colors used across the public experience"
              />
              <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-6">
                <ColorField
                  label="Primary navy"
                  value={theme.navy}
                  onChange={(value) => setTheme((current) => ({ ...current, navy: value }))}
                />
                <ColorField
                  label="Accent red"
                  value={theme.red}
                  onChange={(value) => setTheme((current) => ({ ...current, red: value }))}
                />
                <ColorField
                  label="Highlight amber"
                  value={theme.amber}
                  onChange={(value) => setTheme((current) => ({ ...current, amber: value }))}
                />
                <ColorField
                  label="Paper background"
                  value={theme.paper}
                  onChange={(value) => setTheme((current) => ({ ...current, paper: value }))}
                />
              </div>
              <div className="mx-5 mb-5 overflow-hidden rounded-2xl border border-[#E4E7EC] md:mx-6 md:mb-6">
                <div
                  className="h-28 p-5"
                  style={{ background: `linear-gradient(135deg, ${theme.navy}, ${theme.red})` }}
                >
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    Triad Studio / preview
                  </span>
                  <p className="mt-7 text-xl font-semibold text-white">
                    We brand. You stand out<span style={{ color: theme.amber }}>.</span>
                  </p>
                </div>
                <div className="bg-white px-5 py-3 text-xs text-[#667085]">Live token preview</div>
              </div>
            </Panel>
            <Panel>
              <PanelHeading
                icon={Phone}
                title="Global contact director"
                detail="One source for every contact CTA"
              />
              <div className="space-y-4 p-5 md:p-6">
                <ContactField
                  icon={Phone}
                  label="Primary phone"
                  hint="tel:"
                  value={contact.phone}
                  onChange={(value) => setContact((current) => ({ ...current, phone: value }))}
                />
                <ContactField
                  icon={Smartphone}
                  label="WhatsApp number"
                  hint="wa.me/"
                  value={contact.whatsapp}
                  onChange={(value) => setContact((current) => ({ ...current, whatsapp: value }))}
                />
                <ContactField
                  icon={Mail}
                  label="Support email"
                  hint="mailto:"
                  value={contact.email}
                  onChange={(value) => setContact((current) => ({ ...current, email: value }))}
                />
                <div className="flex gap-2 rounded-xl bg-[#EAF7EF] p-3 text-xs leading-5 text-[#208454]">
                  <Check className="h-4 w-4 shrink-0" /> These routes are used by public quote and
                  footer CTAs.
                </div>
              </div>
            </Panel>
          </div>
          <Panel>
            <PanelHeading
              icon={ImageIcon}
              title="Brand assets"
              detail="Upload the logo and browser icon used across the public site"
            />
            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
              <BrandAssetField
                label="Site logo"
                description="PNG, JPG, WEBP, or SVG up to 5 MB"
                value={branding.logo_url}
                fallback="Bundled logo"
                uploading={uploading === "logo"}
                onChange={(file) => void uploadBrandAsset("logo", file)}
              />
              <BrandAssetField
                label="Favicon"
                description="Square PNG, ICO, SVG, or WEBP up to 5 MB"
                value={branding.favicon_url}
                fallback="Default favicon"
                uploading={uploading === "favicon"}
                onChange={(file) => void uploadBrandAsset("favicon", file)}
              />
            </div>
          </Panel>
          <Panel>
            <PanelHeading
              icon={Smartphone}
              title="Navigation & social links"
              detail="These settings publish to the public header and footer"
            />
            <div className="space-y-6 p-5 md:p-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                    Header links
                  </p>
                </div>
                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div
                      key={`${link.label}-${index}`}
                      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_120px]"
                    >
                      <input
                        value={link.label}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, label: event.target.value } : item,
                            ),
                          )
                        }
                        className={adminInput}
                        placeholder="Label"
                      />
                      <input
                        value={link.href}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, href: event.target.value } : item,
                            ),
                          )
                        }
                        className={adminInput}
                        placeholder="/route or URL"
                      />
                      <select
                        value={link.target}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, target: event.target.value as LinkItem["target"] }
                                : item,
                            ),
                          )
                        }
                        className={adminInput}
                      >
                        <option value="_self">Same tab</option>
                        <option value="_blank">New tab</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Instagram">
                  <input
                    value={socials.instagram}
                    onChange={(event) =>
                      setSocials((current) => ({ ...current, instagram: event.target.value }))
                    }
                    className={adminInput}
                    placeholder="https://instagram.com/triadstudio"
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    value={socials.linkedin}
                    onChange={(event) =>
                      setSocials((current) => ({ ...current, linkedin: event.target.value }))
                    }
                    className={adminInput}
                    placeholder="https://linkedin.com/company/triadstudio"
                  />
                </Field>
                <Field label="Twitter / X">
                  <input
                    value={socials.twitter}
                    onChange={(event) =>
                      setSocials((current) => ({ ...current, twitter: event.target.value }))
                    }
                    className={adminInput}
                    placeholder="https://x.com/triadstudio"
                  />
                </Field>
                <Field label="Footer studio metadata">
                  <input
                    value={seo.studio}
                    onChange={(event) =>
                      setSeo((current) => ({ ...current, studio: event.target.value }))
                    }
                    className={adminInput}
                  />
                </Field>
              </div>
            </div>
          </Panel>
          <Panel>
            <PanelHeading
              icon={Mail}
              title="SEO & footer metadata"
              detail="Default search presentation and legal footer copy"
            />
            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
              <Field label="Default meta title">
                <input
                  value={seo.title}
                  onChange={(event) =>
                    setSeo((current) => ({ ...current, title: event.target.value }))
                  }
                  className={adminInput}
                />
              </Field>
              <Field label="Copyright text">
                <input
                  value={seo.copyright}
                  onChange={(event) =>
                    setSeo((current) => ({ ...current, copyright: event.target.value }))
                  }
                  className={adminInput}
                />
              </Field>
              <Field label="Meta description">
                <textarea
                  value={seo.description}
                  onChange={(event) =>
                    setSeo((current) => ({ ...current, description: event.target.value }))
                  }
                  className={`${adminInput} min-h-24 resize-y md:col-span-2`}
                />
              </Field>
            </div>
          </Panel>
          <Panel>
            <PanelHeading
              icon={Palette}
              title="Footer content"
              detail="Edit the closing message and call to action shown on every public page"
            />
            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
              <Field label="Eyebrow">
                <input
                  value={footer.eyebrow}
                  onChange={(event) =>
                    setFooter((current) => ({ ...current, eyebrow: event.target.value }))
                  }
                  className={adminInput}
                />
              </Field>
              <Field label="CTA label">
                <input
                  value={footer.cta_label}
                  onChange={(event) =>
                    setFooter((current) => ({ ...current, cta_label: event.target.value }))
                  }
                  className={adminInput}
                />
              </Field>
              <Field label="Headline">
                <textarea
                  value={footer.headline}
                  onChange={(event) =>
                    setFooter((current) => ({ ...current, headline: event.target.value }))
                  }
                  className={`${adminInput} min-h-24 resize-y md:col-span-2`}
                />
              </Field>
            </div>
          </Panel>
          <Panel>
            <PanelHeading
              icon={Mail}
              title="Cookie banner"
              detail="Control the site-wide consent banner copied into the storefront"
            />
            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
              <Field label="Enable banner">
                <label className="flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={cookieBanner.enabled}
                    onChange={(event) =>
                      setCookieBanner((current) => ({ ...current, enabled: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-[#CBD5E1]"
                  />
                  Show banner to visitors
                </label>
              </Field>
              <Field label="Policy label">
                <input
                  value={cookieBanner.policyLabel}
                  onChange={(event) =>
                    setCookieBanner((current) => ({ ...current, policyLabel: event.target.value }))
                  }
                  className={adminInput}
                />
              </Field>
              <Field label="Banner heading">
                <input
                  value={cookieBanner.heading}
                  onChange={(event) =>
                    setCookieBanner((current) => ({ ...current, heading: event.target.value }))
                  }
                  className={adminInput}
                />
              </Field>
              <Field label="Accept label">
                <input
                  value={cookieBanner.acceptLabel}
                  onChange={(event) =>
                    setCookieBanner((current) => ({ ...current, acceptLabel: event.target.value }))
                  }
                  className={adminInput}
                />
              </Field>
              <Field label="Decline label">
                <input
                  value={cookieBanner.declineLabel}
                  onChange={(event) =>
                    setCookieBanner((current) => ({ ...current, declineLabel: event.target.value }))
                  }
                  className={adminInput}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    value={cookieBanner.description}
                    onChange={(event) =>
                      setCookieBanner((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className={`${adminInput} min-h-28 resize-y`}
                  />
                </Field>
              </div>
            </div>
          </Panel>
        </>
      ) : null}
    </AdminPage>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl border border-[#E4E7EC] p-4">
      <span className="text-xs font-semibold text-white">{label}</span>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${adminInput} font-mono uppercase`}
        />
      </div>
    </label>
  );
}

function BrandAssetField({
  label,
  description,
  value,
  fallback,
  uploading,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  fallback: string;
  uploading: boolean;
  onChange: (file: File) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#1C222B] p-4">
      <div className="flex min-h-20 items-center gap-4">
        <div className="grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-3">
          {value && value !== "/favicon.png" ? (
            <img
              src={value}
              alt={`${label} preview`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-[#98A2B3]" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs text-[#94A3B8]">{value ? "Custom asset active" : fallback}</p>
          <p className="mt-1 text-[10px] text-[#64748B]">{description}</p>
        </div>
      </div>
      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[#D0D5DD] transition-colors hover:border-[#FF7A00] hover:text-[#FF9500]">
        <Upload className="h-3.5 w-3.5" />
        {uploading ? "Uploading…" : "Choose image"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onChange(file);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function ContactField({
  icon: Icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: typeof Phone;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#344054]">
        <Icon className="h-3.5 w-3.5 text-[#208454]" />
        {label}
      </span>
      <div className="flex items-center rounded-xl border border-[#DCE1E7]">
        <span className="pl-3 text-xs text-[#98A2B3]">{hint}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent px-2.5 py-3 text-sm outline-none"
        />
      </div>
    </label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
        {label}
      </span>
      {children}
    </label>
  );
}
