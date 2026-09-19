import workIdentity from "@/assets/work-identity.jpg";
import workEvent from "@/assets/work-event.jpg";
import workMerch from "@/assets/work-merch.jpg";

export const services = [
  {
    tag: "Identity",
    name: "Brand Identity",
    categoryHref: "/category/apparel",
    detail: "Naming direction, logo systems, visual identity, guidelines",
    deliverables: ["Logo system", "Typography & colour", "Brand guidelines", "Naming direction"],
  },
  {
    tag: "Screen",
    name: "Digital Design",
    categoryHref: "/category/drinkware",
    detail: "Websites, landing pages, social systems, presentations",
    deliverables: ["Websites", "Landing pages", "Social templates", "Decks"],
  },
  {
    tag: "Paper",
    name: "Print Production",
    categoryHref: "/category/event",
    detail: "Stationery, brochures, catalogues, packaging, finishing",
    deliverables: ["Stationery", "Brochures", "Catalogues", "Packaging"],
  },
  {
    tag: "Scale",
    name: "Large Format",
    categoryHref: "/category/event",
    detail: "Banners, backdrops, signage, roll-ups, vehicle graphics",
    deliverables: ["Banners", "Backdrops", "Signage", "Vehicle graphics"],
  },
  {
    tag: "Objects",
    name: "Branded Merch",
    categoryHref: "/category/promo",
    detail: "Apparel, drinkware, corporate gifting, promotional items",
    deliverables: ["Apparel", "Drinkware", "Gifting", "Promo items"],
  },
  {
    tag: "Events",
    name: "Event Collateral",
    categoryHref: "/category/event",
    detail: "Conference kits, badges, wayfinding, programmes",
    deliverables: ["Delegate kits", "Badges", "Wayfinding", "Programmes"],
  },
  {
    tag: "Direction",
    name: "Art Direction",
    categoryHref: "/category/drinkware",
    detail: "Campaign concepts, photography direction, oversight",
    deliverables: ["Campaign concepts", "Photo direction", "Styling", "Oversight"],
  },
  {
    tag: "Delivery",
    name: "Brand Rollout",
    categoryHref: "/category/promo",
    detail: "Templates, asset libraries, supplier coordination",
    deliverables: ["Templates", "Asset libraries", "Supplier coordination", "Training"],
  },
];

export const pillars = [
  {
    n: "01",
    title: "One studio",
    body: "Branding, digital, print and merchandise handled by the same team — no handovers, no drift between what was designed and what gets delivered.",
  },
  {
    n: "02",
    title: "One standard",
    body: "Independently owned and self-funded. We choose our work, so every project gets focused attention rather than a place in a queue.",
  },
  {
    n: "03",
    title: "One outcome",
    body: "A brand that holds together everywhere it appears: on a screen, on paper, on a banner, in someone's hands.",
  },
];

export const stats = [
  { k: "4", v: "Disciplines under one roof" },
  { k: "2 days", v: "Typical reply to enquiries" },
  { k: "100%", v: "Independently owned" },
  { k: "Nairobi", v: "Studio base, work everywhere" },
];

export const process = [
  {
    n: "01",
    title: "Listen",
    body: "We start with the business, not the artwork — audience, ambition, constraints and what has to be true by launch.",
  },
  {
    n: "02",
    title: "Make",
    body: "Focused creative direction, one strong route developed properly instead of a wall of options to choose between.",
  },
  {
    n: "03",
    title: "Deliver",
    body: "We produce what we design. Print, large format and merchandise are supervised in-house through to final delivery.",
  },
];

export const work = [
  {
    slug: "professional-services-stationery",
    category: "Branding",
    img: workIdentity,
    label: "Identity",
    title: "Stationery system for a professional services firm",
    meta: "Brand identity · Print",
    year: "2025",
    client: "Confidential — legal & advisory",
    services: ["Brand Identity", "Print Production"],
    summary:
      "A restrained identity and stationery system built to read as considered on paper first, screen second.",
    body: [
      "The firm had grown past its original mark and needed an identity that could carry weight in a boardroom without shouting. We built a typographic system with a single graphic device, then designed the full stationery suite around it.",
      "Everything was proofed and produced under our supervision — paper stock, ink density and finishing were selected as part of the design, not after it.",
    ],
  },
  {
    slug: "conference-signage",
    category: "Print",
    img: workEvent,
    label: "Environment",
    title: "Signage and wayfinding for a two-day conference",
    meta: "Large format · Event",
    year: "2025",
    client: "Regional industry summit",
    services: ["Large Format", "Event Collateral"],
    summary:
      "A wayfinding and stage environment designed, produced and installed inside a three-week window.",
    body: [
      "Two floors, six rooms and a thousand delegates who needed to find the right session without asking anyone. We designed a colour-coded wayfinding system, delegate collateral and the main stage backdrop as one family.",
      "Because production ran in-house, late programme changes were reprinted overnight rather than renegotiated.",
    ],
  },
  {
    slug: "retail-merch-capsule",
    category: "Digital",
    img: workMerch,
    label: "Objects",
    title: "Merchandise capsule for a retail launch",
    meta: "Merchandise · Production",
    year: "2024",
    client: "Retail launch, Nairobi",
    services: ["Branded Merch", "Art Direction"],
    summary:
      "A tight capsule of apparel and objects that extended a young brand into physical space.",
    body: [
      "Rather than stamping a logo on a catalogue of items, we picked a small set of objects people would actually keep and designed each one properly — fabric weight, print method and packaging included.",
      "The capsule sold through the launch weekend and became the template for the brand's ongoing gifting programme.",
    ],
  },
];

export const featuredWork = work[0]!;

export const socials = [
  { label: "Instagram", href: "https://instagram.com/triadstudio" },
  { label: "LinkedIn", href: "https://linkedin.com/company/triadstudio" },
  { label: "Behance", href: "https://behance.net/triadstudio" },
  { label: "X", href: "https://x.com/triadstudio" },
];
