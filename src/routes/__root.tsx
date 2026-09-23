import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportRuntimeError } from "../lib/runtime-error-reporting";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { CookieBanner } from "@/components/CookieBanner";
import { Toaster } from "@/components/ui/sonner";
import { useLiveTheme, useSiteSettings, useStorefrontRealtime } from "@/lib/storefront";
import { localBusinessLd, organizationLd, websiteLd, OG_IMAGE, POSITIONING } from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportRuntimeError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Site-wide defaults only. Each route sets its own title, description,
      // canonical and social copy through `pageSeo`, which overrides these.
      { title: "Triad Brands | Branding, Print & Merchandise in Nairobi" },
      { name: "description", content: POSITIONING },
      { name: "author", content: "Triad Brands" },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: "Triad Brands" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_KE" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1142" },
      { property: "og:image:height", content: "520" },
      { property: "og:image:alt", content: "Triad Brands — Nairobi branding studio" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&family=TASA+Explorer:wght@400;500;600;700;800&display=swap",
      },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(organizationLd()) },
      { type: "application/ld+json", children: JSON.stringify(websiteLd()) },
      { type: "application/ld+json", children: JSON.stringify(localBusinessLd()) },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  // The admin studio and its sign-in screen render their own chrome — skip
  // the public header/footer/cookie-banner shell on those paths.
  const standalone = location.pathname === "/login" || location.pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      {standalone ? <Outlet /> : <PublicShell />}
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

function PublicShell() {
  useStorefrontRealtime();
  useLiveTheme();
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!settings?.branding.favicon_url) return;
    // Browsers cache the tab favicon aggressively and, in several of them
    // (Chrome included), mutating an existing <link>'s `href` doesn't
    // reliably trigger a re-fetch — the old icon just stays put after a
    // brand-asset update. Removing the old link and inserting a fresh one
    // forces a real fetch of the new URL every time.
    const previous = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
    const next = document.createElement("link");
    next.rel = "icon";
    next.type = settings.branding.favicon_url.endsWith(".svg") ? "image/svg+xml" : "image/png";
    next.href = settings.branding.favicon_url;
    document.head.appendChild(next);
    previous.forEach((link) => link.remove());
  }, [settings?.branding.favicon_url]);

  return (
    <div className="cms-theme-live flex min-h-screen flex-col bg-background text-foreground antialiased">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <WhatsAppFloating />
      <CookieBanner />
    </div>
  );
}
