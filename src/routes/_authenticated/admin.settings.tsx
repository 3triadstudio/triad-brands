import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Image as ImageIcon, Palette, Save, Settings as SettingsIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { getSiteSettingsAdmin, saveSiteSetting, uploadAsset } from "@/lib/admin.functions";
import {
  defaultBranding,
  defaultContacts,
  defaultFooter,
  defaultSeo,
  defaultTheme,
  type BrandingSettings,
  type ContactSettings,
  type CookieBannerSettings,
  type FooterSettings,
  type SeoSettings,
  type ThemeSettings,
} from "@/lib/storefront";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminLoading,
  AdminPage,
  Field,
  Panel,
  PanelHeading,
  StatusPill,
  inputClass,
} from "@/components/admin/ui";

/** Families already loaded by the site's font stylesheet in `__root.tsx`. */
const fontChoices = ["TASA Explorer", "Cairo"] as const;
const monoChoices = ["IBM Plex Mono"] as const;

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SiteSettingsAdmin,
});

const defaultCookieBanner: CookieBannerSettings = {
  enabled: true,
  heading: "We use cookies to keep the site smooth and useful.",
  description:
    "We use essential cookies for the site to function and optional preferences to improve your experience. You can change your choice at any time.",
  acceptLabel: "Accept cookies",
  declineLabel: "Only essentials",
  policyLabel: "Cookie policy",
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function SiteSettingsAdmin() {
  const getSettings = useServerFn(getSiteSettingsAdmin);
  const save = useServerFn(saveSiteSetting);
  const upload = useServerFn(uploadAsset);
  const qc = useQueryClient();

  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [contacts, setContacts] = useState<ContactSettings>(defaultContacts);
  const [seo, setSeo] = useState<SeoSettings>(defaultSeo);
  const [footer, setFooter] = useState<FooterSettings>(defaultFooter);
  const [cookieBanner, setCookieBanner] = useState<CookieBannerSettings>(defaultCookieBanner);
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const settings = useQuery({ queryKey: ["admin-site-settings"], queryFn: () => getSettings({}) });

  useEffect(() => {
    const channel = supabase
      .channel("admin-site-settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-site-settings"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  useEffect(() => {
    if (!settings.data) return;
    const map = new Map(
      (settings.data as { key: string; value: unknown }[]).map((r) => [r.key, r.value]),
    );
    setTheme({ ...defaultTheme, ...(map.get("theme") as Partial<ThemeSettings> | undefined) });
    setContacts({
      ...defaultContacts,
      ...(map.get("contacts") as Partial<ContactSettings> | undefined),
    });
    setSeo({ ...defaultSeo, ...(map.get("seo") as Partial<SeoSettings> | undefined) });
    setFooter({ ...defaultFooter, ...(map.get("footer") as Partial<FooterSettings> | undefined) });
    setCookieBanner({
      ...defaultCookieBanner,
      ...(map.get("cookie_banner") as Partial<CookieBannerSettings> | undefined),
    });
    setBranding({
      ...defaultBranding,
      ...(map.get("branding") as Partial<BrandingSettings> | undefined),
    });
  }, [settings.data]);

  const saveMutation = useMutation({
    mutationFn: (input: { key: string; value: unknown }) => save({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-site-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  async function uploadBrandAsset(kind: "logo" | "favicon", file: File) {
    const setBusy = kind === "logo" ? setUploadingLogo : setUploadingFavicon;
    setBusy(true);
    try {
      const base64 = await fileToBase64(file);
      const { publicUrl } = await upload({
        data: { folder: "branding", filename: file.name, contentType: file.type, base64 },
      });
      const next = { ...branding, [kind === "logo" ? "logo_url" : "favicon_url"]: publicUrl };
      setBranding(next);
      saveMutation.mutate({ key: "branding", value: next });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image");
    } finally {
      setBusy(false);
    }
  }

  if (settings.isPending) {
    return (
      <AdminPage eyebrow="Studio" title="Site settings, under one roof." description="Loading…">
        <Panel>
          <AdminLoading label="Loading settings" />
        </Panel>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      eyebrow="Studio"
      title="Site settings, under one roof."
      description="Brand tokens, contact details, SEO, and the little things every page depends on."
      action={<StatusPill status="Realtime connected" />}
    >
      <SettingsSection
        icon={Palette}
        title="Brand tokens"
        detail="Colours applied live across the storefront"
        onSave={() => saveMutation.mutate({ key: "theme", value: theme })}
        saving={saveMutation.isPending}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorField
            label="Primary accent"
            value={theme.primary_accent}
            onChange={(v) => setTheme({ ...theme, primary_accent: v })}
          />
          <ColorField
            label="Secondary accent"
            value={theme.secondary_accent}
            onChange={(v) => setTheme({ ...theme, secondary_accent: v })}
          />
          <ColorField
            label="Background"
            value={theme.bg_color}
            onChange={(v) => setTheme({ ...theme, bg_color: v })}
          />
          <ColorField
            label="Ink"
            value={theme.ink_color}
            onChange={(v) => setTheme({ ...theme, ink_color: v })}
          />
          <ColorField
            label="Card border"
            value={theme.card_border}
            onChange={(v) => setTheme({ ...theme, card_border: v })}
          />
        </div>

        <div className="mt-6 border-t border-[#F3F4F6] pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
            Typography
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Display font">
              <select
                value={theme.font_display ?? defaultTheme.font_display}
                onChange={(event) => setTheme({ ...theme, font_display: event.target.value })}
                className={inputClass}
              >
                {fontChoices.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Body font">
              <select
                value={theme.font_body ?? defaultTheme.font_body}
                onChange={(event) => setTheme({ ...theme, font_body: event.target.value })}
                className={inputClass}
              >
                {fontChoices.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mono font">
              <select
                value={theme.font_mono ?? defaultTheme.font_mono}
                onChange={(event) => setTheme({ ...theme, font_mono: event.target.value })}
                className={inputClass}
              >
                {monoChoices.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Base text size">
              <input
                value={theme.base_font_size ?? defaultTheme.base_font_size}
                onChange={(event) => setTheme({ ...theme, base_font_size: event.target.value })}
                placeholder="16px"
                className={inputClass}
              />
            </Field>
            <Field label="Heading scale">
              <input
                value={theme.heading_scale ?? defaultTheme.heading_scale}
                onChange={(event) => setTheme({ ...theme, heading_scale: event.target.value })}
                placeholder="1"
                className={inputClass}
              />
            </Field>
            <Field label="Body line height">
              <input
                value={theme.body_line_height ?? defaultTheme.body_line_height}
                onChange={(event) => setTheme({ ...theme, body_line_height: event.target.value })}
                placeholder="1.6"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 border-t border-[#F3F4F6] pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
            Shape and rhythm
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Corner radius">
              <input
                value={theme.radius ?? defaultTheme.radius}
                onChange={(event) => setTheme({ ...theme, radius: event.target.value })}
                placeholder="16px"
                className={inputClass}
              />
            </Field>
            <Field label="Section spacing">
              <input
                value={theme.section_spacing ?? defaultTheme.section_spacing}
                onChange={(event) => setTheme({ ...theme, section_spacing: event.target.value })}
                placeholder="80px"
                className={inputClass}
              />
            </Field>
            <Field label="Page width">
              <input
                value={theme.container_width ?? defaultTheme.container_width}
                onChange={(event) => setTheme({ ...theme, container_width: event.target.value })}
                placeholder="1400px"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={SettingsIcon}
        title="Contact details"
        detail="Phone, WhatsApp, and email shown across the site"
        onSave={() => saveMutation.mutate({ key: "contacts", value: contacts })}
        saving={saveMutation.isPending}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Phone">
            <input
              className={inputClass}
              value={contacts.phone}
              onChange={(e) => setContacts({ ...contacts, phone: e.target.value })}
            />
          </Field>
          <Field label="WhatsApp (digits only)">
            <input
              className={inputClass}
              value={contacts.whatsapp}
              onChange={(e) => setContacts({ ...contacts, whatsapp: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              value={contacts.email}
              onChange={(e) => setContacts({ ...contacts, email: e.target.value })}
            />
          </Field>
        </div>
      </SettingsSection>

      <Panel>
        <PanelHeading icon={ImageIcon} title="Brand assets" detail="Logo and favicon" />
        <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-6">
          <BrandAssetField
            label="Logo"
            value={branding.logo_url}
            fallback="Using default wordmark"
            uploading={uploadingLogo}
            onChange={(file) => void uploadBrandAsset("logo", file)}
          />
          <BrandAssetField
            label="Favicon"
            value={branding.favicon_url}
            fallback="Using default favicon"
            uploading={uploadingFavicon}
            onChange={(file) => void uploadBrandAsset("favicon", file)}
          />
        </div>
      </Panel>

      <SettingsSection
        icon={SettingsIcon}
        title="SEO metadata"
        detail="Default title, description, and studio copyright"
        onSave={() => saveMutation.mutate({ key: "seo", value: seo })}
        saving={saveMutation.isPending}
      >
        <div className="grid gap-4">
          <Field label="Site title">
            <input
              className={inputClass}
              value={seo.title}
              onChange={(e) => setSeo({ ...seo, title: e.target.value })}
            />
          </Field>
          <Field label="Meta description">
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={seo.description}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Copyright line">
              <input
                className={inputClass}
                value={seo.copyright}
                onChange={(e) => setSeo({ ...seo, copyright: e.target.value })}
              />
            </Field>
            <Field label="Studio location">
              <input
                className={inputClass}
                value={seo.studio}
                onChange={(e) => setSeo({ ...seo, studio: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={SettingsIcon}
        title="Footer content"
        detail="The closing call to action on every page"
        onSave={() => saveMutation.mutate({ key: "footer", value: footer })}
        saving={saveMutation.isPending}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <input
              className={inputClass}
              value={footer.eyebrow}
              onChange={(e) => setFooter({ ...footer, eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Button label">
            <input
              className={inputClass}
              value={footer.cta_label}
              onChange={(e) => setFooter({ ...footer, cta_label: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Headline">
          <textarea
            className={`${inputClass} min-h-16 resize-y`}
            value={footer.headline}
            onChange={(e) => setFooter({ ...footer, headline: e.target.value })}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        icon={SettingsIcon}
        title="Cookie banner"
        detail="Shown once per visitor until they choose"
        onSave={() => saveMutation.mutate({ key: "cookie_banner", value: cookieBanner })}
        saving={saveMutation.isPending}
      >
        <div className="space-y-4">
          <Field label="Heading">
            <input
              className={inputClass}
              value={cookieBanner.heading}
              onChange={(e) => setCookieBanner({ ...cookieBanner, heading: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={cookieBanner.description}
              onChange={(e) => setCookieBanner({ ...cookieBanner, description: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Accept label">
              <input
                className={inputClass}
                value={cookieBanner.acceptLabel}
                onChange={(e) => setCookieBanner({ ...cookieBanner, acceptLabel: e.target.value })}
              />
            </Field>
            <Field label="Decline label">
              <input
                className={inputClass}
                value={cookieBanner.declineLabel}
                onChange={(e) => setCookieBanner({ ...cookieBanner, declineLabel: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </SettingsSection>
    </AdminPage>
  );
}

function SettingsSection({
  icon,
  title,
  detail,
  onSave,
  saving,
  children,
}: {
  icon: typeof Palette;
  title: string;
  detail: string;
  onSave: () => void;
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <Panel>
      <PanelHeading
        icon={icon}
        title={title}
        detail={detail}
        action={
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />{" "}
            {saving ? "Saving…" : "Save section"}
          </button>
        }
      />
      <div className="space-y-4 p-5 md:p-6">{children}</div>
    </Panel>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-[#E5E7EB]"
        />
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </div>
    </Field>
  );
}

function BrandAssetField({
  label,
  value,
  fallback,
  uploading,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  uploading: boolean;
  onChange: (file: File) => void;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-2">
          {value ? (
            <img
              src={value}
              alt={`${label} preview`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-[#9CA3AF]" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#111827]">{label}</p>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            {value ? "Custom asset active" : fallback}
          </p>
        </div>
      </div>
      <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#111827] hover:border-[#ED1D2B] hover:text-[#ED1D2B]">
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {uploading ? "Uploading…" : "Choose image"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
