import heroApparel from "@/assets/hero-apparel.jpg";
import heroEvent from "@/assets/hero-event.jpg";
import heroGifting from "@/assets/hero-gifting.jpg";
import productPolo from "@/assets/product-polo.jpg";
import productBanner from "@/assets/product-banner.jpg";
import productMug from "@/assets/product-mug.jpg";

export const heroSlides = [
  {
    id: "apparel",
    img: heroApparel,
    eyebrow: "Corporate apparel & embroidery",
    title: "Elevate your corporate identity",
    body: "Nairobi-based embroidery and print, produced in-house with fast turnaround on team apparel of any size.",
  },
  {
    id: "event",
    img: heroEvent,
    eyebrow: "Event & exhibition gear",
    title: "Own the room at every event",
    body: "Pull-up banners, teardrop flags, backdrops and podiums — printed, finished and delivered on schedule.",
  },
  {
    id: "gifting",
    img: heroGifting,
    eyebrow: "Office essentials & branded gifting",
    title: "Gifts your clients keep using",
    body: "Notebooks, drinkware, pens and gift sets branded to spec, with bulk pricing across Kenya.",
  },
] as const;

export const trustBadges = [
  "Fast Turnaround in Nairobi",
  "Custom Printing & Embroidery",
  "Bulk Order Pricing",
] as const;

export type Product = {
  id: string;
  badge: string;
  category: string;
  title: string;
  rating: number;
  reviews: number;
  from: number;
  img: string;
};

export const featuredProducts: Product[] = [
  {
    id: "embroidered-polo",
    badge: "Popular",
    category: "Apparel & Wearables",
    title: "Custom Embroidered Polo",
    rating: 4.9,
    reviews: 128,
    from: 1500,
    img: productPolo,
  },
  {
    id: "pull-up-banner",
    badge: "Best Seller",
    category: "Event & Exhibition",
    title: "Pull-Up Banner Stand",
    rating: 4.8,
    reviews: 96,
    from: 6500,
    img: productBanner,
  },
  {
    id: "engraved-mug",
    badge: "Bulk Offer",
    category: "Drinkware & Office",
    title: "Laser-Engraved Mug",
    rating: 4.7,
    reviews: 74,
    from: 850,
    img: productMug,
  },
];

export const catalogCategories = [
  {
    id: "apparel",
    name: "Apparel & Wearables",
    blurb: "Polos, T-shirts, hoodies, caps",
    icon: "shirt",
    img: productPolo,
  },
  {
    id: "drinkware",
    name: "Drinkware & Office",
    blurb: "Mugs, flasks, notebooks, pens",
    icon: "mug",
    img: productMug,
  },
  {
    id: "event",
    name: "Event & Exhibition",
    blurb: "Banners, backdrops, podiums, flags",
    icon: "flag",
    img: productBanner,
  },
  {
    id: "promo",
    name: "Promotional Merchandise",
    blurb: "Keychains, lanyards, tote bags",
    icon: "gift",
    img: heroGifting,
  },
] as const;

export type CatalogCategory = (typeof catalogCategories)[number];

export const categoryRouteConfig: Record<
  string,
  { name: string; description: string; aliases: string[] }
> = {
  apparel: {
    name: "Apparel & Wearables",
    description:
      "Custom polos, T-shirts, hoodies, caps, and branded apparel for your team or event.",
    aliases: ["apparel", "apparel & wearables"],
  },
  drinkware: {
    name: "Drinkware & Office",
    description: "Personalized mugs, flasks, notebooks, pens, and office essentials.",
    aliases: ["drinkware", "drinkware & office"],
  },
  event: {
    name: "Event & Exhibition",
    description: "Professional banners, backdrops, podiums, flags, and exhibition materials.",
    aliases: ["event", "event & exhibition", "conference equipment"],
  },
  promo: {
    name: "Promotional Merchandise",
    description: "Branded keychains, lanyards, tote bags, and promotional giveaways.",
    aliases: ["promo", "promotional merchandise"],
  },
};

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
      description: "",
      aliases: [normalizedSlug],
    }
  );
}

export const valueProps = [
  {
    title: "In-House Nairobi Workshop",
    body: "Guaranteed quality control on every print, checked by the same team that designed it.",
    icon: "factory",
  },
  {
    title: "Free Sample Proofing",
    body: "Digital and physical mockups approved before any full production run begins.",
    icon: "proof",
  },
  {
    title: "Reliable Delivery",
    body: "Express delivery options across Nairobi and courier dispatch nationwide.",
    icon: "truck",
  },
] as const;

export const formatKES = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
