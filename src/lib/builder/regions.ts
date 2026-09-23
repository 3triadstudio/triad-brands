import { createWidgetElement } from "@/lib/builder/registry";
import { defaultContacts } from "@/lib/storefront";
import {
  createElementId,
  emptyLink,
  type BuilderDocument,
  type BuilderElement,
  type PropsRecord,
} from "@/lib/builder/types";

/**
 * Starting points for the two global regions.
 *
 * These mirror what the built-in `SiteHeader` and `SiteFooter` already render,
 * so publishing a region for the first time keeps the site looking the same —
 * and every link, label and logo in it becomes editable from that point on.
 */

function node(type: string, props: PropsRecord = {}, children: BuilderElement[] = []) {
  const base = createWidgetElement(type, createElementId(type));
  return { ...base, props: { ...base.props, ...props }, children };
}

function headerDocument(): BuilderDocument {
  return {
    version: 2,
    pageId: "header",
    title: "Site header",
    description: "Global header shown on every page",
    root: [
      {
        ...node("section", { maxWidth: "1400", tag: "header" }),
        style: { base: { paddingTop: "12px", paddingBottom: "12px" } },
        children: [
          node("container", { direction: "row", align: "center", justify: "between", gap: 24 }, [
            node("logo", { variant: "onWhite", height: 36, link: { ...emptyLink, href: "/" } }),
            node("nav", { source: "settings", direction: "row" }),
            node("button", {
              label: "Request Quote",
              variant: "accent",
              size: "sm",
              shape: "pill",
              icon: "ArrowUpRight",
              link: { ...emptyLink, action: "start_project" },
            }),
          ]),
        ],
      },
    ],
    seo: {
      title: "",
      description: "",
      canonical: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterCard: "summary_large_image",
      noindex: false,
    },
  };
}

function footerDocument(): BuilderDocument {
  return {
    version: 2,
    pageId: "footer",
    title: "Site footer",
    description: "Global footer shown on every page",
    root: [
      {
        ...node("section", { maxWidth: "1400", tag: "footer" }),
        style: { base: { paddingTop: "80px", paddingBottom: "80px" } },
        children: [
          node("eyebrow", { text: "Start a project" }),
          node("heading", {
            text: "Let's make it work together",
            level: "h2",
            display: true,
            accentDot: true,
          }),
          node("button", {
            label: "Start the brief",
            variant: "accent",
            icon: "ArrowUpRight",
            link: { ...emptyLink, action: "start_project" },
          }),
          node("spacer", { height: 56 }),
          node("grid", { columns: 4, tabletColumns: 2, mobileColumns: 1, gap: 32 }, [
            node("container", { gap: 16 }, [
              node("logo", { variant: "onDark", height: 48 }),
              node("text", {
                text: "A Nairobi branding studio: brand identity, print, signage and branded merchandise, designed and produced in house.",
                size: "sm",
              }),
            ]),
            node("container", { gap: 12 }, [
              node("eyebrow", { text: "Explore", accent: false }),
              node("nav", {
                source: "custom",
                direction: "column",
                items: [
                  { label: "Services", link: { ...emptyLink, href: "/solutions" } },
                  { label: "Shop the catalog", link: { ...emptyLink, href: "/shop" } },
                  { label: "Branded apparel", link: { ...emptyLink, href: "/category/apparel" } },
                  { label: "Event branding", link: { ...emptyLink, href: "/category/event" } },
                ],
              }),
            ]),
            node("container", { gap: 12 }, [
              node("eyebrow", { text: "Company", accent: false }),
              node("nav", {
                source: "custom",
                direction: "column",
                items: [
                  { label: "About us", link: { ...emptyLink, href: "/about" } },
                  { label: "Contact", link: { ...emptyLink, href: "/contact" } },
                ],
              }),
            ]),
            node("container", { gap: 12 }, [
              node("eyebrow", { text: "Get in touch", accent: false }),
              node("nav", {
                source: "custom",
                direction: "column",
                items: [
                  {
                    label: "Email us",
                    link: { ...emptyLink, href: `mailto:${defaultContacts.email}` },
                  },
                ],
              }),
              node("social", { source: "settings", showLabels: false, size: 18 }),
            ]),
          ]),
        ],
      },
    ],
    seo: {
      title: "",
      description: "",
      canonical: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterCard: "summary_large_image",
      noindex: false,
    },
  };
}

export const REGION_IDS = ["header", "footer"] as const;
export type RegionId = (typeof REGION_IDS)[number];

export function isRegionId(pageId: string): pageId is RegionId {
  return pageId === "header" || pageId === "footer";
}

export function defaultRegionDocument(pageId: RegionId): BuilderDocument {
  return pageId === "header" ? headerDocument() : footerDocument();
}
