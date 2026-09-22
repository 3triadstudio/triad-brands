import { Link } from "@tanstack/react-router";
import { LazyBuilderCanvas } from "@/components/builder/LazyBuilderCanvas";
import { isBuilderDocument } from "@/lib/builder/types";
import { ArrowUpRight, Facebook, Globe, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { socials } from "@/lib/site-data";
import { StartProjectDialog } from "@/components/StartProjectDialog";
import {
  defaultContacts,
  usePublishedPage,
  useSiteSettings,
  useSocialLinks,
} from "@/lib/storefront";
import { optimizeImageUrl } from "@/lib/utils";

const logoOnDark = "/TRIAD_LOGO_ON DARK.png";

export function SiteFooter() {
  const { data: region } = usePublishedPage("footer");
  const { data: settings } = useSiteSettings();
  const { data: managedSocialLinks } = useSocialLinks();
  const email = settings?.contacts.email ?? defaultContacts.email;
  const configuredCopyright = settings?.seo.copyright?.trim();
  const copyright =
    configuredCopyright && !/made with|❤️|♥️/iu.test(configuredCopyright)
      ? configuredCopyright
      : `© ${new Date().getFullYear()} Triad Brands`;
  const footer = settings?.footer;
  const socialLinks = managedSocialLinks?.length
    ? managedSocialLinks
    : socials.map((social) => ({ ...social, icon_key: social.label.toLowerCase() }));
  const socialIcons = {
    facebook: Facebook,
    globe: Globe,
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter,
    x: Twitter,
    youtube: Youtube,
  } as const;
  if (isBuilderDocument(region)) {
    return (
      <footer id="contact" className="px-3 pb-3 md:px-6 md:pb-6" data-cms-block="global-footer">
        <div className="mx-auto max-w-[1400px] rounded-[var(--radius)] bg-primary px-6 text-primary-foreground md:px-14">
          <LazyBuilderCanvas root={region.root} />
        </div>
      </footer>
    );
  }

  return (
    <footer id="contact" className="px-3 pb-3 md:px-6 md:pb-6" data-cms-block="global-footer">
      <div className="mx-auto max-w-[1400px] rounded-[var(--radius)] bg-primary px-6 py-20 text-primary-foreground md:px-14 md:py-32">
        <p className="label-mono opacity-60" data-cms-field="footer.eyebrow">
          {footer?.eyebrow ?? "Start a project"}
        </p>
        <h2
          className="display mt-8 text-[clamp(2.25rem,7vw,6rem)]"
          data-cms-field="footer.headline"
        >
          {(footer?.headline ?? "Let's make it\nwork together.").split("\n").map((line, index) => (
            <span key={`${line}-${index}`} className="block">
              {line.endsWith(".") ? (
                <>
                  {line.slice(0, -1)}
                  <span className="text-accent">.</span>
                </>
              ) : (
                line
              )}
            </span>
          ))}
        </h2>

        <div className="mt-12">
          <StartProjectDialog className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-medium text-accent-foreground transition-transform hover:-translate-y-0.5">
            <>
              <span data-cms-field="footer.cta_label">
                {footer?.cta_label ?? "Start the brief"}
              </span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          </StartProjectDialog>
        </div>

        <div className="mt-20 grid gap-12 border-t border-primary-foreground/15 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={optimizeImageUrl(settings?.branding.logo_url || logoOnDark, 240)}
              alt="Triad Brands"
              width={240}
              height={109}
              className="h-14 w-auto max-w-[220px] object-contain object-left"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = logoOnDark;
              }}
            />
            <p className="mt-6 max-w-xs leading-relaxed opacity-70">
              A Nairobi branding studio: brand identity, print, signage and branded merchandise,
              designed and produced in house.
            </p>
            <form
              action={`mailto:${email}`}
              method="post"
              encType="text/plain"
              className="mt-8 flex max-w-sm border-b border-primary-foreground/30 pb-2"
            >
              <label htmlFor="footer-newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter"
                name="email"
                type="email"
                required
                placeholder="Your email"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-primary-foreground/50"
              />
              <button
                type="submit"
                aria-label="Subscribe to the newsletter"
                className="text-accent transition-transform hover:translate-x-0.5"
              >
                <ArrowUpRight className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div>
            <p className="label-mono opacity-60">Explore</p>
            <ul className="mt-5 space-y-3">
              {[
                ["Services", "/solutions"],
                ["Shop the catalog", "/shop"],
                ["Branded apparel", "/category/apparel"],
                ["Event branding", "/category/event"],
                ["Corporate gifts", "/category/promo"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    to={href as "/"}
                    className="opacity-70 transition-opacity hover:opacity-100"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-mono opacity-60">Triad Brands</p>
            <ul className="mt-5 space-y-3">
              {[
                ["About Triad Brands", "/about"],
                ["Selected work", "/work/professional-services-stationery"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    to={href as "/"}
                    className="opacity-70 transition-opacity hover:opacity-100"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-mono opacity-60">Get in touch</p>
            <a
              href={`mailto:${email}`}
              className="mt-5 inline-flex items-center gap-2 opacity-70 transition-opacity hover:opacity-100"
            >
              Email Triad Brands
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
              {socialLinks.map((s) => {
                const Icon =
                  socialIcons[s.icon_key.toLowerCase() as keyof typeof socialIcons] ?? Globe;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="inline-flex items-center gap-2 text-sm opacity-70 transition-opacity hover:opacity-100"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{s.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-primary-foreground/15 pt-8 text-sm opacity-60">
          <p>{copyright}</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy-policy" className="transition-opacity hover:opacity-100">
              Privacy
            </Link>
            <Link to="/terms" className="transition-opacity hover:opacity-100">
              Terms
            </Link>
            <Link to="/cookies" className="transition-opacity hover:opacity-100">
              Cookies
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
