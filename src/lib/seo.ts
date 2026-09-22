import { socials } from "@/lib/site-data";

export const SITE_URL = "https://www.triadbrands.co.ke";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// One sentence that defines what Triad Brands is. Every page description is a
// variation on this, so the positioning stays identical across search results,
// social cards and structured data.
export const POSITIONING =
  "Triad Brands is a Nairobi branding studio that designs brand identities and produces the print, signage and branded merchandise that carry them.";

// Single source of truth for the studio's name/address/phone (NAP).
// Local SEO and directory listings cross-check these values, so keep them
// consistent everywhere they appear.
export const business = {
  name: "Triad Brands",
  legalName: "Triad Brands",
  url: SITE_URL,
  logo: OG_IMAGE,
  image: OG_IMAGE,
  telephone: "+254700390157",
  email: "3.triadstudio@gmail.com",
  addressLocality: "Nairobi",
  addressCountry: "KE",
  areaServed: ["Nairobi", "Kenya"],
  priceRange: "$$",
  description: POSITIONING,
  sameAs: socials.map((s) => s.href),
} as const;

/**
 * Canonical title + description for every fixed page, in one place.
 *
 * Both the route `head()` and the CMS page templates read from here, so a page
 * keeps the same search snippet whether it is served from the route component
 * or from a document published in the Page Builder.
 *
 * Descriptions are written to land between 120 and 160 characters, each leading
 * with a different primary term so the pages do not compete with one another.
 */
export const pageCopy = {
  home: {
    path: "/",
    title: "Branded Merchandise & Printing in Nairobi | Triad Brands",
    description:
      "Custom branded apparel, event branding, corporate gifts and print, designed and produced in our Nairobi workshop with bulk pricing across Kenya.",
  },
  solutions: {
    path: "/solutions",
    title: "Branding, Print & Merchandise Services | Triad Brands",
    description:
      "Brand identity, digital design, print production, large format and branded merchandise from one Nairobi studio — designed, produced and delivered in house.",
  },
  shop: {
    path: "/shop",
    title: "Shop Branded Merchandise & Promotional Items | Triad Brands",
    description:
      "Browse branded apparel, drinkware, event gear and corporate gifts with live KES pricing. Order custom promotional items from our Nairobi workshop.",
  },
  about: {
    path: "/about",
    title: "About Triad Brands | Branding Studio in Nairobi",
    description:
      "Triad Brands is an independent Nairobi branding studio. We design brand identities and produce the print, signage and merchandise that carry them.",
  },
  contact: {
    path: "/contact",
    title: "Contact Triad Brands | Branding & Print Quotes in Nairobi",
    description:
      "Request a quote for branding, printing or branded merchandise in Nairobi. Send a short brief and the studio replies with a practical next step.",
  },
  work: {
    path: "/work",
    title: "Selected Work | Branding & Print Projects | Triad Brands",
    description:
      "Selected branding, print, event and merchandise projects delivered by Triad Brands for clients in Nairobi and across Kenya.",
  },
  privacy: {
    path: "/privacy-policy",
    title: "Privacy Policy | Triad Brands",
    description:
      "How Triad Brands collects, uses and protects personal information submitted through our website, project briefs and WhatsApp enquiries.",
  },
  terms: {
    path: "/terms",
    title: "Terms of Use | Triad Brands",
    description:
      "The terms that apply when you use the Triad Brands website, request a quote, or place an order for branding, print or branded merchandise.",
  },
  cookies: {
    path: "/cookies",
    title: "Cookie Policy | Triad Brands",
    description:
      "Which cookies the Triad Brands website sets, what each one is used for, and how to change your cookie preferences at any time.",
  },
} as const;

/**
 * Builds the full head block for a page: title, description, Open Graph,
 * Twitter card and the page's own canonical.
 *
 * Every public route uses this. The root route also declares its absolute
 * canonical so crawlers do not receive the fallback `/` value.
 */
export function pageSeo(input: {
  path: string;
  title: string;
  description: string;
  type?: "website" | "article" | "product";
  image?: string;
  robots?: string;
}) {
  const url = `${SITE_URL}${input.path}`;
  const image = input.image ?? OG_IMAGE;
  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      ...(input.robots ? [{ name: "robots", content: input.robots }] : []),
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:type", content: input.type ?? "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: input.title },
      { name: "twitter:description", content: input.description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: business.name,
    legalName: business.legalName,
    url: business.url,
    logo: business.logo,
    image: business.image,
    description: business.description,
    telephone: business.telephone,
    email: business.email,
    areaServed: business.areaServed,
    sameAs: business.sameAs,
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: business.url,
    name: business.name,
    description: business.description,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function localBusinessLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#localbusiness`,
    name: business.name,
    url: business.url,
    image: business.image,
    logo: business.logo,
    description: business.description,
    telephone: business.telephone,
    email: business.email,
    priceRange: business.priceRange,
    areaServed: business.areaServed,
    address: {
      "@type": "PostalAddress",
      addressLocality: business.addressLocality,
      addressCountry: business.addressCountry,
    },
    sameAs: business.sameAs,
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqLd(items: readonly { readonly q: string; readonly a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function productLd(input: {
  id: string;
  name: string;
  description: string;
  images: string[];
  sku?: string;
  price: number;
  inStock: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.images,
    sku: input.sku || input.id,
    brand: { "@type": "Brand", name: business.name },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${input.id}`,
      priceCurrency: "KES",
      price: input.price,
      availability: input.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
  };
}
