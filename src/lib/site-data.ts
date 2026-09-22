import workIdentity from "@/assets/work-identity.jpg";
import workEvent from "@/assets/work-event.jpg";
import workMerch from "@/assets/work-merch.jpg";

export const services = [
  {
    tag: "Identity",
    name: "Brand Identity",
    categoryHref: "/category/apparel",
    detail:
      "Logo systems, visual identity and brand guidelines built to hold up in print and on screen",
    deliverables: ["Logo system", "Typography & colour", "Brand guidelines", "Naming direction"],
  },
  {
    tag: "Screen",
    name: "Digital Design",
    categoryHref: "/category/drinkware",
    detail:
      "Websites, landing pages, social templates and pitch decks that match the printed brand",
    deliverables: ["Websites", "Landing pages", "Social templates", "Decks"],
  },
  {
    tag: "Paper",
    name: "Print Production",
    categoryHref: "/category/event",
    detail:
      "Business stationery, brochures, catalogues and packaging, printed and finished in Nairobi",
    deliverables: ["Stationery", "Brochures", "Catalogues", "Packaging"],
  },
  {
    tag: "Scale",
    name: "Large Format",
    categoryHref: "/category/event",
    detail: "Pull-up banners, backdrops, signage and vehicle branding printed at full scale",
    deliverables: ["Banners", "Backdrops", "Signage", "Vehicle graphics"],
  },
  {
    tag: "Objects",
    name: "Branded Merchandise",
    categoryHref: "/category/promo",
    detail: "Branded apparel, drinkware, corporate gifts and promotional items produced in bulk",
    deliverables: ["Apparel", "Drinkware", "Corporate gifts", "Promo items"],
  },
  {
    tag: "Events",
    name: "Event Branding",
    categoryHref: "/category/event",
    detail: "Conference kits, delegate badges, wayfinding and programmes for events of any size",
    deliverables: ["Delegate kits", "Badges", "Wayfinding", "Programmes"],
  },
  {
    tag: "Direction",
    name: "Art Direction",
    categoryHref: "/category/drinkware",
    detail: "Campaign concepts, product and brand photography direction, and creative oversight",
    deliverables: ["Campaign concepts", "Photo direction", "Styling", "Oversight"],
  },
  {
    tag: "Delivery",
    name: "Brand Rollout",
    categoryHref: "/category/promo",
    detail:
      "Templates, asset libraries and supplier coordination so a new brand lands everywhere at once",
    deliverables: ["Templates", "Asset libraries", "Supplier coordination", "Training"],
  },
];

export const pillars = [
  {
    n: "01",
    title: "One studio",
    body: "Branding, digital, print and merchandise handled by the same team — no handovers, and no drift between what was designed and what gets delivered.",
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
  { k: "1 day", v: "Typical reply to a new brief" },
  { k: "100%", v: "Independently owned" },
  { k: "Nairobi", v: "Workshop base, delivery Kenya-wide" },
];

// How a project runs. Lives on /solutions only — /about covers the studio
// itself through `principles`, so the two pages never repeat each other.
export const process = [
  {
    n: "01",
    title: "Listen",
    body: "We start with the business, not the artwork — audience, ambition, budget and what has to be true by launch day.",
  },
  {
    n: "02",
    title: "Make",
    body: "Focused creative direction: one strong route developed properly, instead of a wall of options to choose between.",
  },
  {
    n: "03",
    title: "Deliver",
    body: "We produce what we design. Print, large format and merchandise are supervised in our Nairobi workshop through to delivery.",
  },
];

// The studio's operating principles. Distinct from `process` above, which
// describes the shape of a project rather than how the studio is run.
export const principles = [
  {
    n: "01",
    title: "Independent",
    body: "No holding company, no media rebates, no incentive to sell you work you do not need. We answer to the brief and to the people paying for it.",
  },
  {
    n: "02",
    title: "Accountable",
    body: "The people who design the work run the production. When a colour shifts or a deadline moves, you talk to the person who can fix it.",
  },
  {
    n: "03",
    title: "Built to last",
    body: "We design identities that still work in three years, on substrates and at sizes nobody thought about on day one.",
  },
];

export const work = [
  {
    slug: "professional-services-stationery",
    category: "Branding",
    img: workIdentity,
    label: "Identity",
    title: "Brand identity and stationery for a professional services firm",
    meta: "Brand identity · Print",
    year: "2025",
    client: "Confidential — legal & advisory",
    services: ["Brand Identity", "Print Production"],
    summary:
      "A restrained brand identity and printed stationery system for a Nairobi legal and advisory firm, built to read as considered on paper first and screen second.",
    body: [
      "The firm had grown past its original mark and needed a brand identity that could carry weight in a boardroom without shouting. We built a typographic system around a single graphic device, then designed the full stationery suite — letterheads, business cards, folders and report covers — to match.",
      "Everything was proofed and produced under our supervision. Paper stock, ink density and finishing were chosen as part of the design, not bolted on after it.",
    ],
  },
  {
    slug: "conference-signage",
    category: "Print",
    img: workEvent,
    label: "Environment",
    title: "Event branding and wayfinding for a two-day conference",
    meta: "Large format · Event",
    year: "2025",
    client: "Regional industry summit",
    services: ["Large Format", "Event Branding"],
    summary:
      "Conference wayfinding, delegate collateral and a main stage backdrop designed, printed and installed in Nairobi inside a three-week window.",
    body: [
      "Two floors, six rooms and a thousand delegates who needed to find the right session without asking anyone. We designed a colour-coded wayfinding system, delegate collateral and the main stage backdrop as one family, then printed the large format work in house.",
      "Because production ran under the same roof, late programme changes were reprinted overnight rather than renegotiated with a supplier.",
    ],
  },
  {
    slug: "retail-merch-capsule",
    category: "Merchandise",
    img: workMerch,
    label: "Objects",
    title: "Branded merchandise capsule for a retail launch",
    meta: "Merchandise · Production",
    year: "2024",
    client: "Retail launch, Nairobi",
    services: ["Branded Merchandise", "Art Direction"],
    summary:
      "A tight capsule of branded apparel and gifting that extended a young Nairobi retail brand into physical space.",
    body: [
      "Rather than stamping a logo across a catalogue of promotional items, we picked a small set of objects people would actually keep and designed each one properly — fabric weight, print method and packaging included.",
      "The capsule sold through the launch weekend and became the template for the brand's ongoing corporate gifting programme.",
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

// Answered on /contact and emitted as FAQPage structured data from the same
// source, so the page and the rich result can never drift apart.
export const faqs = [
  {
    q: "Do I need a finished brief?",
    a: "No. A rough outline of the problem, your timing and what you need made or changed is enough for a useful first conversation.",
  },
  {
    q: "What kind of projects do you take on?",
    a: "Brand identity, digital design, print, large format, branded merchandise and event branding — often several of them in one project.",
  },
  {
    q: "How soon can we start?",
    a: "We normally reply to a new brief within one working day. Timing depends on the shape of the project, but we are direct about availability from the start.",
  },
  {
    q: "Can you handle production too?",
    a: "Yes. Printing, large format and merchandise production run from our Nairobi workshop, so we carry the work from first idea through to delivery.",
  },
  {
    q: "Do you deliver outside Nairobi?",
    a: "Yes. We dispatch branded merchandise and print by courier across Kenya, and handle installation for event and signage work in Nairobi.",
  },
  {
    q: "Is there a minimum order for branded merchandise?",
    a: "Minimums vary by product and branding method. Most apparel and drinkware start at small runs, and unit pricing drops as volume goes up.",
  },
] as const;
