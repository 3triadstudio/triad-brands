import heroApparel from "@/assets/hero-apparel.jpg";
import heroEvent from "@/assets/hero-event.jpg";
import heroGifting from "@/assets/hero-gifting.jpg";
import productPolo from "@/assets/product-polo.jpg";
import productBanner from "@/assets/product-banner.jpg";
import productMug from "@/assets/product-mug.jpg";

// Each slide title becomes the homepage <h1> while it is active, so every one
// of them leads with a term people actually search for.
export const heroSlides = [
  {
    id: "apparel",
    img: heroApparel,
    eyebrow: "Corporate apparel & embroidery",
    title: "Branded apparel your team wants to wear",
    body: "Embroidery and screen printing produced in our Nairobi workshop — from ten shirts to a thousand, with a proof approved before every run.",
  },
  {
    id: "event",
    img: heroEvent,
    eyebrow: "Event & exhibition branding",
    title: "Event branding that fills the room",
    body: "Pull-up banners, teardrop flags, backdrops and podiums, printed and finished in time for set-up day.",
  },
  {
    id: "gifting",
    img: heroGifting,
    eyebrow: "Corporate gifts & office branding",
    title: "Corporate gifts people keep using",
    body: "Notebooks, drinkware, pens and gift sets branded to spec, priced for bulk orders and delivered across Kenya.",
  },
] as const;

// Short proof chips under the hero. Deliberately terse — `valueProps` below
// carries the explanation, so the two never say the same thing twice.
export const trustBadges = [
  "Nairobi workshop",
  "Bulk order pricing",
  "Same-week turnaround",
] as const;

export const catalogCategories = [
  {
    id: "apparel",
    icon: "shirt",
    img: productPolo,
  },
  {
    id: "drinkware",
    icon: "mug",
    img: productMug,
  },
  {
    id: "event",
    icon: "flag",
    img: productBanner,
  },
  {
    id: "promo",
    icon: "gift",
    img: heroGifting,
  },
] as const;

/**
 * One record per category, used by the category grid, the category page body
 * and that page's meta description. Keeping `blurb` and `description` here
 * stops the grid and the landing page from describing the same category in two
 * different ways.
 */
export const categoryRouteConfig: Record<
  string,
  { name: string; blurb: string; description: string; aliases: string[] }
> = {
  apparel: {
    name: "Apparel & Wearables",
    blurb: "Polos, T-shirts, hoodies and caps",
    description:
      "Custom branded apparel in Nairobi: embroidered polos, printed T-shirts, hoodies and caps for teams, events and staff uniforms.",
    aliases: ["apparel", "apparel & wearables"],
  },
  drinkware: {
    name: "Drinkware & Office",
    blurb: "Mugs, flasks, notebooks and pens",
    description:
      "Branded drinkware and office essentials: printed mugs, engraved flasks, notebooks and pens for corporate gifting across Kenya.",
    aliases: ["drinkware", "drinkware & office"],
  },
  event: {
    name: "Event & Exhibition",
    blurb: "Banners, backdrops, podiums and flags",
    description:
      "Event and exhibition branding in Nairobi: pull-up banners, teardrop flags, stage backdrops and branded podiums, printed and delivered on schedule.",
    aliases: ["event", "event & exhibition", "conference equipment"],
  },
  promo: {
    name: "Promotional Merchandise",
    blurb: "Keychains, lanyards and tote bags",
    description:
      "Promotional merchandise and corporate giveaways: branded keychains, lanyards, tote bags and gift sets produced in bulk in Nairobi.",
    aliases: ["promo", "promotional merchandise"],
  },
};

export type CatalogCategory = {
  id: string;
  name: string;
  blurb: string;
  icon: (typeof catalogCategories)[number]["icon"];
  img: string;
};

/** The homepage category grid: layout data joined to the copy above. */
export const categoryCards: CatalogCategory[] = catalogCategories.map((category) => ({
  id: category.id,
  icon: category.icon,
  img: category.img,
  name: getCategoryConfig(category.id).name,
  blurb: getCategoryConfig(category.id).blurb,
}));

export function categorySlugFromHref(href: string | undefined, fallback: string): string {
  if (!href) return fallback;
  try {
    const url = new URL(href, "https://triad.local");
    const match = url.pathname.match(/^\/category\/([^/]+)\/?$/i);
    return match?.[1] || fallback;
  } catch {
    return fallback;
  }
}

export function getCategoryConfig(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  return (
    categoryRouteConfig[normalizedSlug] ?? {
      name: slug,
      blurb: "",
      description: "",
      aliases: [normalizedSlug],
    }
  );
}

// The mechanics behind the trust chips: how the work is made, checked and
// delivered. Each one explains something the chips only assert.
export const valueProps = [
  {
    title: "Design and production under one roof",
    body: "The team that draws your artwork runs the print, so the file you approve is the thing that arrives on your desk.",
    icon: "factory",
  },
  {
    title: "A proof before every run",
    body: "Digital mockups on every job, and physical samples on bulk orders, signed off before we commit to the full production run.",
    icon: "proof",
  },
  {
    title: "Delivery across Kenya",
    body: "Same-week dispatch on stocked items, courier delivery nationwide, and installation handled in person for event and signage work.",
    icon: "truck",
  },
] as const;

export const formatKES = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
