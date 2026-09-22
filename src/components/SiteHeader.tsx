import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LazyBuilderCanvas } from "@/components/builder/LazyBuilderCanvas";
import { isBuilderDocument } from "@/lib/builder/types";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { StartProjectDialog } from "@/components/StartProjectDialog";
import { useCart } from "@/lib/cart";
import { usePublishedPage, useSiteSettings } from "@/lib/storefront";
import { Cart } from "@/components/Cart";
import { optimizeImageUrl } from "@/lib/utils";

const nav = [
  { label: "About", href: "/about" },
  { label: "Solutions", href: "/solutions" },
  { label: "Shop", href: "/shop" },
  { label: "Contact", href: "/contact" },
] as const;

const logoOnWhite = "/TRIAD_LOGO_ON WHITE.svg";

export function SiteHeader() {
  const { data: region } = usePublishedPage("header");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const cartItems = useCart();
  const links: Array<{ label: string; href: string; target: "_self" | "_blank" }> = (
    (settings?.navigation?.length ? settings.navigation : nav) as Array<{
      label: string;
      href: string;
      target?: "_self" | "_blank";
    }>
  ).map((link) => ({
    label: link.label,
    href: link.href,
    target: link.target ?? "_self",
  }));

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // A published header region replaces the built-in markup entirely, so every
  // link, label and logo inside it is editable from the builder.
  if (isBuilderDocument(region)) {
    return (
      <header
        className="sticky top-0 z-50 px-3 pt-3 md:px-6 md:pt-5"
        data-cms-block="global-header"
      >
        <div className="mx-auto max-w-[1400px] rounded-[1.35rem] border border-border bg-background/90 px-4 py-1 shadow-[0_12px_40px_color-mix(in_oklab,var(--foreground)_6%,transparent)] backdrop-blur-xl md:px-5">
          <LazyBuilderCanvas root={region.root} />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 md:px-6 md:pt-5" data-cms-block="global-header">
      <div className="mx-auto max-w-[1400px] rounded-[1.35rem] border border-border bg-background/90 px-4 py-3 shadow-[0_12px_40px_color-mix(in_oklab,var(--foreground)_6%,transparent)] backdrop-blur-xl md:px-5">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              src={optimizeImageUrl(settings?.branding.logo_url || logoOnWhite, 180)}
              alt="Triad Brands"
              width={180}
              height={64}
              className="h-8 w-auto shrink-0 md:h-9"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = logoOnWhite;
              }}
            />
          </Link>

          <div className="ml-auto flex items-center gap-5 md:gap-7">
            <nav className="hidden items-center gap-7 md:flex">
              {links.map((n) => (
                <Link
                  key={`${n.label}-${n.href}`}
                  to={n.href as "/"}
                  target={n.target}
                  className="label-mono relative text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{
                    className:
                      "label-mono relative text-foreground after:absolute after:-bottom-3 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-accent",
                  }}
                  activeOptions={{ exact: n.href === "/" }}
                >
                  <span data-cms-field={`nav.${links.indexOf(n)}.label`}>{n.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
              {cartItems.length > 0 ? <Cart /> : null}
              <StartProjectDialog className="label-mono group inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-accent-foreground transition-colors hover:bg-primary md:px-5">
                <>
                  <span className="hidden sm:inline">Request Quote</span>
                  <span className="sm:hidden">Quote</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </>
              </StartProjectDialog>
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="min-h-11 min-w-11 rounded-lg border border-border p-2 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        {mobileOpen ? (
          <nav
            id="mobile-navigation"
            className="mt-4 grid gap-1 border-t border-border pt-3 md:hidden"
          >
            {links.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                to={link.href as "/"}
                target={link.target}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <span data-cms-field={`nav.${links.indexOf(link)}.label`}>{link.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
