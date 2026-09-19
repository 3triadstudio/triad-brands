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
      { title: "Triad Studio — We brand. You stand out." },
      {
        name: "description",
        content:
          "Triad Studio is an independent creative studio in Nairobi: branding, digital design, print production and branded merchandise under one roof.",
      },
      { name: "author", content: "Triad Studio" },
      { property: "og:title", content: "Triad Studio — We brand. You stand out." },
      {
        property: "og:description",
        content:
          "An independent Nairobi creative studio bringing branding, design, print and merchandise together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const standalone = location.pathname === "/login" || location.pathname.startsWith("/admin");

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("cmsPreview") === "1";
    if (!preview || window.parent === window) return;

    const describeElement = (element: HTMLElement) => {
      const path: string[] = [];
      let current: HTMLElement | null = element;
      while (current && current !== document.body && path.length < 5) {
        const tag = current.tagName.toLowerCase();
        const siblings = current.parentElement
          ? Array.from(current.parentElement.children).filter(
              (child) => child.tagName === current?.tagName,
            )
          : [];
        const index = Math.max(0, siblings.indexOf(current));
        path.unshift(`${tag}:nth-of-type(${index + 1})`);
        current = current.parentElement;
      }
      return path.join(" > ");
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const editable =
        target.closest<HTMLElement>("h1,h2,h3,h4,p,a,button,img,section,article") ?? target;
      const field = editable.closest<HTMLElement>("[data-cms-field]");
      const block = editable.closest<HTMLElement>("[data-cms-block]");
      event.preventDefault();
      event.stopPropagation();
      if (field && !(field instanceof HTMLImageElement)) {
        field.contentEditable = "true";
        field.focus();
      }
      const fieldKey = field?.dataset["cmsField"] ?? null;
      const blockKey = block?.dataset["cmsBlock"] ?? null;
      window.parent.postMessage(
        {
          type: "triad:cms-select",
          selector: fieldKey
            ? `[data-cms-field="${fieldKey}"]`
            : blockKey
              ? `[data-cms-block="${blockKey}"]`
              : describeElement(editable),
          blockKey,
          fieldKey,
          tag: editable.tagName.toLowerCase(),
          text:
            editable instanceof HTMLImageElement
              ? editable.alt
              : (editable.textContent?.trim().slice(0, 220) ?? ""),
          image: editable instanceof HTMLImageElement ? editable.src : null,
          href: editable instanceof HTMLAnchorElement ? editable.getAttribute("href") : null,
        },
        window.location.origin,
      );
    };

    const onInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.contentEditable !== "true") return;
      const field = target.closest<HTMLElement>("[data-cms-field]");
      const block = target.closest<HTMLElement>("[data-cms-block]");
      const fieldKey = field?.dataset["cmsField"] ?? null;
      const blockKey = block?.dataset["cmsBlock"] ?? null;
      window.parent.postMessage(
        {
          type: "triad:cms-inline-edit",
          selector: fieldKey ? `[data-cms-field="${fieldKey}"]` : describeElement(target),
          blockKey,
          fieldKey,
          text: target.textContent ?? "",
        },
        window.location.origin,
      );
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "triad:cms-layout") {
        const blocks = event.data.blocks as { id: string; visible: boolean }[] | undefined;
        if (!blocks?.length) return;
        const nodes = new Map(
          Array.from(document.querySelectorAll<HTMLElement>("[data-cms-block]")).map(
            (node) => [node.dataset["cmsBlock"] ?? "", node] as const,
          ),
        );
        const first = nodes.get(blocks[0]?.id ?? "");
        const parent = first?.parentElement;
        if (!parent) return;
        for (const block of blocks) {
          const node = nodes.get(block.id);
          if (!node || node.parentElement !== parent) continue;
          node.hidden = !block.visible;
          parent.appendChild(node);
        }
        return;
      }
      if (event.data?.type !== "triad:cms-update") return;
      const { selector, text, image, href, css } = event.data as {
        selector?: string;
        text?: string;
        image?: string;
        href?: string;
        css?: Record<string, string>;
      };
      if (!selector) return;
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return;
      if (typeof text === "string" && !(element instanceof HTMLImageElement))
        element.textContent = text;
      if (typeof image === "string" && element instanceof HTMLImageElement) element.src = image;
      if (typeof href === "string" && element instanceof HTMLAnchorElement) element.href = href;
      if (css) Object.assign(element.style, css);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("input", onInput, true);
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "triad:cms-ready" }, window.location.origin);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("input", onInput, true);
      window.removeEventListener("message", onMessage);
    };
  }, []);

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
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && settings?.branding.favicon_url) link.href = settings.branding.favicon_url;
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
