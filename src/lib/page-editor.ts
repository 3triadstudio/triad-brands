import { z } from "zod";

export const pageIdSchema = z.enum([
  "home",
  "shop",
  "solutions",
  "about",
  "contact",
  "category",
  "product",
  "work",
  "privacy",
  "terms",
  "cookies",
]);
export type PageId = z.infer<typeof pageIdSchema>;

export const blockKindSchema = z.enum([
  "container",
  "columns",
  "hero",
  "featured",
  "categories",
  "promo",
  "value_props",
  "rich_text",
  "projects",
  "services",
  "contact_form",
  "founders",
]);
export type BlockKind = z.infer<typeof blockKindSchema>;

export const blockCatalog = [
  {
    kind: "container",
    label: "Container",
    detail: "Group blocks in a layout section",
    defaultContent: {},
  },
  {
    kind: "columns",
    label: "Columns",
    detail: "Two-column responsive layout",
    defaultContent: {},
  },
  {
    kind: "hero",
    label: "Hero carousel",
    detail: "Image-led opening section",
    defaultContent: {},
  },
  {
    kind: "featured",
    label: "Product grid",
    detail: "Live catalog products",
    defaultContent: { heading: "Featured solutions" },
  },
  {
    kind: "categories",
    label: "Category grid",
    detail: "Repeatable category cards",
    defaultContent: { "categories.heading": "Browse by category" },
  },
  {
    kind: "promo",
    label: "Promo banner",
    detail: "Offer or campaign CTA",
    defaultContent: {},
  },
  {
    kind: "value_props",
    label: "Value props",
    detail: "Three-column trust points",
    defaultContent: {},
  },
  {
    kind: "rich_text",
    label: "Rich text",
    detail: "Eyebrow, heading, and body",
    defaultContent: { eyebrow: "New section", heading: "Add a strong headline.", body: "" },
  },
  {
    kind: "services",
    label: "Services",
    detail: "Live services collection",
    defaultContent: {},
  },
  {
    kind: "projects",
    label: "Projects",
    detail: "Live portfolio collection",
    defaultContent: {},
  },
  {
    kind: "contact_form",
    label: "Contact CTA",
    detail: "Project enquiry prompt",
    defaultContent: { heading: "Let’s make it work together." },
  },
  {
    kind: "founders",
    label: "Founders",
    detail: "Three-founder profile section",
    defaultContent: {
      eyebrow: "The founders",
      heading: "Three points of view. One standard.",
      body: "Triad is shaped by three founders who stay close to the thinking, making, and delivery.",
      founder_1_name: "Founder One",
      founder_1_role: "Creative direction",
      founder_1_bio: "Brand thinking and the point of view behind the work.",
      founder_2_name: "Founder Two",
      founder_2_role: "Design and digital",
      founder_2_bio: "Systems and experiences that make the brand useful.",
      founder_3_name: "Founder Three",
      founder_3_role: "Production and delivery",
      founder_3_bio: "The craft and operational detail that gets work into the world.",
    },
  },
] as const satisfies ReadonlyArray<{
  kind: BlockKind;
  label: string;
  detail: string;
  defaultContent: Record<string, string>;
}>;

export type BlockCatalogItem = (typeof blockCatalog)[number];

const designSchema = z
  .object({
    padding: z.string().max(32).optional(),
    margin: z.string().max(32).optional(),
    color: z.string().max(32).optional(),
    background: z.string().max(32).optional(),
    backgroundColor: z.string().max(32).optional(),
    textAlign: z.enum(["left", "center", "right"]).optional(),
    fontSize: z.string().max(32).optional(),
    borderRadius: z.string().max(32).optional(),
    marginBlock: z.string().max(32).optional(),
    display: z.string().max(16).optional(),
  })
  .catchall(z.string().max(64));

const blockSchemaBase = z.object({
  id: z.string().min(1).max(80),
  kind: blockKindSchema,
  label: z.string().min(1).max(120),
  visible: z.boolean().default(true),
  mobileVisible: z.boolean().default(true),
  content: z.record(z.string(), z.string()).default({}),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        label: z.string().min(1).max(120),
        description: z.string().max(300).default(""),
        href: z.string().max(300).default("/solutions"),
        buttonLabel: z.string().max(80).default("Browse"),
        image: z.string().max(600).optional(),
        visible: z.boolean().default(true),
        sortOrder: z.number().int().min(0).default(0),
      }),
    )
    .max(40)
    .default([]),
  design: designSchema.default({}),
});
const blockSchema: z.ZodType<PageBlock> = z.lazy(
  () =>
    blockSchemaBase.extend({
      children: z.array(blockSchema).max(20).optional().default([]),
    }) as z.ZodType<PageBlock>,
);

export type SeoSettings = {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
};

export const pageDocumentSchema: z.ZodType<PageDocument> = z.object({
  version: z.literal(1),
  pageId: pageIdSchema,
  title: z.string().min(1).max(160),
  description: z.string().max(320).default(""),
  blocks: z.array(blockSchema).max(40),
  seo: z
    .object({
      title: z.string().max(160).default(""),
      description: z.string().max(320).default(""),
      canonical: z.string().max(300).default(""),
      ogTitle: z.string().max(160).optional().default(""),
      ogDescription: z.string().max(320).optional().default(""),
      ogImage: z.string().max(600).optional().default(""),
      twitterCard: z
        .enum(["summary", "summary_large_image"])
        .optional()
        .default("summary_large_image"),
    })
    .default({}),
}) as z.ZodType<PageDocument>;

export type PageDocument = {
  version: 1;
  pageId: PageId;
  title: string;
  description: string;
  blocks: PageBlock[];
  seo: SeoSettings;
};
export type PageBlock = {
  id: string;
  kind: BlockKind;
  label: string;
  visible: boolean;
  mobileVisible: boolean;
  content: Record<string, string>;
  items: PageBlockItem[];
  design: Record<string, string>;
  children?: PageBlock[];
};
export type PageBlockItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  buttonLabel?: string;
  image?: string;
  visible?: boolean;
  sortOrder?: number;
};

export const landingPageDocument: PageDocument = {
  version: 1,
  pageId: "home",
  title: "Landing Page",
  description: "Triad Brands storefront landing page",
  blocks: [
    {
      id: "hero",
      kind: "hero",
      label: "Hero Carousel",
      visible: true,
      mobileVisible: true,
      content: {},
      items: [],
      design: {},
    },
    {
      id: "featured",
      kind: "featured",
      label: "Featured Solutions",
      visible: true,
      mobileVisible: true,
      content: {},
      items: [],
      design: {},
    },
    {
      id: "categories",
      kind: "categories",
      label: "Category Grid",
      visible: true,
      mobileVisible: true,
      content: {},
      items: [],
      design: {},
    },
    {
      id: "promo",
      kind: "promo",
      label: "Promo Banner",
      visible: true,
      mobileVisible: true,
      content: {},
      items: [],
      design: {},
    },
    {
      id: "value_props",
      kind: "value_props",
      label: "Value Props",
      visible: true,
      mobileVisible: true,
      content: {},
      items: [],
      design: {},
    },
  ],
  seo: {
    title: "Triad Brands — We brand. You stand out.",
    description: "Branding, print, digital design, and branded merchandise from Nairobi.",
    canonical: "/",
  },
};

function policyPage(
  pageId: Extract<PageId, "privacy" | "terms" | "cookies">,
  title: string,
  heading: string,
  description: string,
  sections: Array<{ heading: string; body: string }>,
): PageDocument {
  return {
    version: 1,
    pageId,
    title,
    description,
    blocks: [
      {
        id: `${pageId}_intro`,
        kind: "rich_text",
        label: `${title} introduction`,
        visible: true,
        mobileVisible: true,
        content: { eyebrow: "Triad Brands", heading, body: description },
        items: [],
        design: {},
      },
      ...sections.map((section, index) => ({
        id: `${pageId}_section_${index + 1}`,
        kind: "rich_text" as const,
        label: section.heading,
        visible: true,
        mobileVisible: true,
        content: { heading: section.heading, body: section.body },
        items: [],
        design: {},
      })),
    ],
    seo: {
      title: `${title} — Triad Brands`,
      description,
      canonical: pageId === "privacy" ? "/privacy-policy" : `/${pageId}`,
    },
  };
}

const pageTemplates: Record<Exclude<PageId, "home">, PageDocument> = {
  shop: {
    version: 1,
    pageId: "shop",
    title: "Shop",
    description: "Browse branded merchandise from Triad Brands.",
    blocks: [
      {
        id: "shop_intro",
        kind: "rich_text",
        label: "Shop introduction",
        visible: true,
        mobileVisible: true,
        content: {
          eyebrow: "Shop the catalog",
          heading: "Branded goods, made to move.",
          body: "Browse live availability, choose what fits your brief, and add items to your cart.",
        },
        items: [],
        design: {},
      },
      {
        id: "shop_products",
        kind: "featured",
        label: "Product catalog",
        visible: true,
        mobileVisible: true,
        content: { heading: "Browse the catalog" },
        items: [],
        design: {},
      },
    ],
    seo: {
      title: "Shop — Triad Brands",
      description: "Branded merchandise by Triad Brands.",
      canonical: "/shop",
    },
  },
  solutions: {
    version: 1,
    pageId: "solutions",
    title: "Solutions",
    description: "Branding, design, print and merchandise services.",
    blocks: [
      {
        id: "solutions_intro",
        kind: "rich_text",
        label: "Solutions introduction",
        visible: true,
        mobileVisible: true,
        content: {
          eyebrow: "Solutions",
          heading: "Make the brand impossible to miss.",
          body: "Strategy, design and production in one connected team.",
        },
        items: [],
        design: {},
      },
      {
        id: "solutions_services",
        kind: "services",
        label: "Services collection",
        visible: true,
        mobileVisible: true,
        content: {},
        items: [],
        design: {},
      },
      {
        id: "solutions_cta",
        kind: "contact_form",
        label: "Project CTA",
        visible: true,
        mobileVisible: true,
        content: { heading: "Have a brief? Let’s make it work." },
        items: [],
        design: {},
      },
    ],
    seo: {
      title: "Solutions — Triad Brands",
      description: "Branding, design, print and merchandise services.",
      canonical: "/solutions",
    },
  },
  about: {
    version: 1,
    pageId: "about",
    title: "About Triad Brands",
    description: "An independent Nairobi brand studio.",
    blocks: [
      {
        id: "about_intro",
        kind: "rich_text",
        label: "About introduction",
        visible: true,
        mobileVisible: true,
        content: {
          eyebrow: "Brands",
          heading: "Small enough to care. Serious enough to deliver.",
          body: "Triad is an independent Nairobi brand studio for brands that need more than a logo and less than a revolving door of suppliers.",
        },
        items: [],
        design: {},
      },
      {
        id: "about_projects",
        kind: "projects",
        label: "Selected work",
        visible: true,
        mobileVisible: true,
        content: { heading: "Selected work" },
        items: [],
        design: {},
      },
      {
        id: "about_founders",
        kind: "founders",
        label: "The founders",
        visible: true,
        mobileVisible: true,
        content: {
          eyebrow: "The founders",
          heading: "Three points of view. One standard.",
          body: "Triad is shaped by three founders who stay close to the thinking, making, and delivery.",
          founder_1_name: "Founder One",
          founder_1_role: "Creative direction",
          founder_1_bio: "Brand thinking and the point of view behind the work.",
          founder_2_name: "Founder Two",
          founder_2_role: "Design and digital",
          founder_2_bio: "Systems and experiences that make the brand useful.",
          founder_3_name: "Founder Three",
          founder_3_role: "Production and delivery",
          founder_3_bio: "The craft and operational detail that gets work into the world.",
        },
        items: [],
        design: {},
      },
      {
        id: "about_cta",
        kind: "contact_form",
        label: "About CTA",
        visible: true,
        mobileVisible: true,
        content: { heading: "Bring the brief. We will bring the point of view." },
        items: [],
        design: {},
      },
    ],
    seo: {
      title: "About — Triad Brands",
      description: "Meet the independent Triad Brands team.",
      canonical: "/about",
    },
  },
  contact: {
    version: 1,
    pageId: "contact",
    title: "Contact Triad Brands",
    description: "Start a project with Triad Brands.",
    blocks: [
      {
        id: "contact_intro",
        kind: "rich_text",
        label: "Contact introduction",
        visible: true,
        mobileVisible: true,
        content: {
          eyebrow: "Contact",
          heading: "Start with the thing that matters.",
          body: "A new identity, a launch that needs to land, or a production problem that needs an owner.",
        },
        items: [],
        design: {},
      },
      {
        id: "contact_form",
        kind: "contact_form",
        label: "Contact form",
        visible: true,
        mobileVisible: true,
        content: { heading: "Tell us what you are building." },
        items: [],
        design: {},
      },
    ],
    seo: {
      title: "Contact — Triad Brands",
      description: "Start a brief with Triad Brands.",
      canonical: "/contact",
    },
  },
  category: {
    version: 1,
    pageId: "category",
    title: "Category",
    description: "Browse products by category.",
    blocks: [
      {
        id: "category_intro",
        kind: "rich_text",
        label: "Category introduction",
        visible: true,
        mobileVisible: true,
        content: { eyebrow: "Category", heading: "Browse the collection.", body: "" },
        items: [],
        design: {},
      },
      {
        id: "category_products",
        kind: "featured",
        label: "Category products",
        visible: true,
        mobileVisible: true,
        content: { heading: "Available products" },
        items: [],
        design: {},
      },
    ],
    seo: {
      title: "Category — Triad Brands",
      description: "Browse Triad Brands products.",
      canonical: "/category",
    },
  },
  product: {
    version: 1,
    pageId: "product",
    title: "Product",
    description: "Product details.",
    blocks: [
      {
        id: "product_detail",
        kind: "rich_text",
        label: "Product detail",
        visible: true,
        mobileVisible: true,
        content: { eyebrow: "Product", heading: "Product details.", body: "" },
        items: [],
        design: {},
      },
      {
        id: "product_cta",
        kind: "contact_form",
        label: "Product enquiry",
        visible: true,
        mobileVisible: true,
        content: { heading: "Need a custom quote?" },
        items: [],
        design: {},
      },
    ],
    seo: {
      title: "Product — Triad Brands",
      description: "Product details from Triad Brands.",
      canonical: "/product",
    },
  },
  work: {
    version: 1,
    pageId: "work",
    title: "Selected work",
    description: "Selected projects by Triad Brands.",
    blocks: [
      {
        id: "work_intro",
        kind: "rich_text",
        label: "Work introduction",
        visible: true,
        mobileVisible: true,
        content: { eyebrow: "Selected work", heading: "Work that earns attention.", body: "" },
        items: [],
        design: {},
      },
      {
        id: "work_projects",
        kind: "projects",
        label: "Projects collection",
        visible: true,
        mobileVisible: true,
        content: {},
        items: [],
        design: {},
      },
    ],
    seo: {
      title: "Work — Triad Brands",
      description: "Selected Triad Brands projects.",
      canonical: "/work",
    },
  },
  privacy: policyPage(
    "privacy",
    "Privacy Policy",
    "Your information, handled with care.",
    "How Triad Brands collects, uses and protects information when you use this website or contact us.",
    [
      {
        heading: "Information we collect",
        body: "We collect information you choose to send us through enquiry forms, email, WhatsApp or other direct contact. This may include your name, contact details, company, project requirements and any files or context you provide.",
      },
      {
        heading: "How we use information",
        body: "We use enquiry information to respond to requests, prepare proposals, deliver projects, provide support and improve our services. We do not sell personal information or use it for unrelated marketing without a lawful basis or your consent.",
      },
      {
        heading: "Sharing and retention",
        body: "We may share necessary information with trusted production, technology or delivery partners working on your brief. We keep information only for as long as it is needed for the purpose collected, our business records or legal obligations.",
      },
      {
        heading: "Your choices",
        body: "You may ask us to access, correct or delete personal information we hold about you, subject to applicable law. Contact us at hello@triad.studio and include enough detail for us to identify your request.",
      },
    ],
  ),
  terms: policyPage(
    "terms",
    "Terms of Use",
    "Clear expectations make better work.",
    "The terms that apply when you browse this website, request a quote or engage Triad Brands.",
    [
      {
        heading: "Using this website",
        body: "You may use this website for lawful, personal or business purposes. You must not misuse the website, interfere with its operation, attempt unauthorised access or use its content in a way that infringes another person's rights.",
      },
      {
        heading: "Enquiries and quotes",
        body: "An enquiry is not an order or a binding commitment. Prices, timelines, specifications and availability are confirmed in a written proposal or order confirmation. Production begins once the agreed approval and payment terms are met.",
      },
      {
        heading: "Intellectual property",
        body: "Unless agreed otherwise in writing, Triad Brands retains rights in its pre-existing tools, methods and unused concepts. Rights in final approved work transfer only as stated in the relevant project agreement and after outstanding invoices are settled.",
      },
      {
        heading: "Changes",
        body: "We may update these terms or this website from time to time. The latest version will be published here. Questions about these terms can be sent to hello@triad.studio.",
      },
    ],
  ),
  cookies: policyPage(
    "cookies",
    "Cookie Policy",
    "A small note about cookies.",
    "This Cookie Policy explains how Triad Brands uses cookies, browser storage and similar technologies when you visit our website. It should be read together with our Privacy Policy, which explains how information connected with these technologies may be handled.",
    [
      {
        heading: "What cookies are",
        body: "Cookies are small text files placed on your device by a website. Similar technologies can store or read information in your browser in other ways. These tools can help a website remember a session or preference, keep features working, understand broad usage patterns and improve reliability.",
      },
      {
        heading: "Essential cookies and storage",
        body: "Some cookies or browser storage are necessary for core functions such as security, session handling, remembering a technical preference or keeping a form and page working. Because the site may not function properly without them, these technologies may be used when you request the relevant service or where permitted by law.",
      },
      {
        heading: "Functional preferences",
        body: "Where enabled, preference technologies help us remember choices such as how the site behaves during your visit. These technologies are intended to make the experience more consistent, and they are not used to sell personal information.",
      },
      {
        heading: "Understanding site usage",
        body: "Where enabled, privacy-conscious analytics may help us understand which pages are useful, whether links work and how visitors move through the site. Analytics information is used to improve content and performance. We do not use this page to promise that a particular analytics provider is always active; the tools in use may change as the website changes.",
      },
      {
        heading: "Third-party content and links",
        body: "Embedded content, payment tools, maps, social features or links to other websites may be operated by third parties and may set their own cookies or similar technologies. Their practices are controlled by their own privacy and cookie policies. Review those policies before using a third-party feature or leaving our website.",
      },
      {
        heading: "Your controls",
        body: "You can block, delete or limit cookies through your browser settings. Your browser may also let you review stored site data and set rules for individual websites. Blocking essential storage can prevent parts of the site from working. If we introduce a consent control for optional technologies, you can use it to change your choice where available.",
      },
      {
        heading: "How long information is kept",
        body: "Some cookies last only until you close your browser, while others remain until they expire or you delete them. The duration depends on the purpose and the technology used. We keep information associated with cookies and analytics only as long as reasonably necessary for the relevant purpose, security, legal obligations or reporting.",
      },
      {
        heading: "Updates and questions",
        body: "We may update this policy when the website, providers or legal requirements change. The latest effective date will appear at the top of this page. Questions about our use of cookies can be sent to 3.triadstudio@gmail.com.",
      },
    ],
  ),
};

export const pageDocuments: Record<PageId, PageDocument> = {
  home: landingPageDocument,
  ...pageTemplates,
};

export function getDefaultPageDocument(pageId: PageId): PageDocument {
  return pageDocuments[pageId];
}

export function normalizePageDocument(
  input: unknown,
  fallback = landingPageDocument,
): PageDocument {
  const parsed = pageDocumentSchema.safeParse(input);
  return parsed.success ? parsed.data : fallback;
}

export function reorderBlocks(
  blocks: PageBlock[],
  sourceId: string,
  targetId: string,
): PageBlock[] {
  if (sourceId === targetId) return blocks;
  const sourceIndex = blocks.findIndex((block) => block.id === sourceId);
  const targetIndex = blocks.findIndex((block) => block.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return blocks;
  const next = [...blocks];
  const [source] = next.splice(sourceIndex, 1);
  if (!source) return blocks;
  next.splice(targetIndex, 0, source);
  return next;
}
