import { createWidgetElement } from "@/lib/builder/registry";
import {
  createElementId,
  emptyLink,
  isBuilderDocument,
  type BuilderDocument,
  type BuilderElement,
  type PropsRecord,
} from "@/lib/builder/types";
import {
  getDefaultPageDocument,
  type PageBlock,
  type PageDocument,
  type PageId,
} from "@/lib/page-editor";
import { defaultRegionDocument, isRegionId } from "@/lib/builder/regions";

/**
 * Converts the legacy section-based document (v1) into the builder's element
 * tree (v2).
 *
 * Every live page is still stored as v1, so this runs on open. It is
 * deliberately lossless for content: a v1 block's copy, items, links and design
 * all land on real widgets, which is what makes the existing site editable in
 * the new builder rather than something the client has to rebuild by hand.
 */

function element(
  type: string,
  props: PropsRecord = {},
  children: BuilderElement[] = [],
): BuilderElement {
  const base = createWidgetElement(type, createElementId(type));
  return {
    ...base,
    props: { ...base.props, ...props },
    children,
  };
}

function section(children: BuilderElement[], design: Record<string, string> = {}): BuilderElement {
  const node = element("section");
  return {
    ...node,
    style: { base: { ...(node.style.base ?? {}), ...design } },
    children,
  };
}

function textStack(block: PageBlock): BuilderElement[] {
  const out: BuilderElement[] = [];
  const eyebrow = block.content["eyebrow"];
  const heading = block.content["heading"];
  const body = block.content["body"];
  if (eyebrow) out.push(element("eyebrow", { text: eyebrow }));
  if (heading) out.push(element("heading", { text: heading, level: "h2", display: true }));
  if (body) out.push(element("text", { text: body, size: "lg" }));
  return out;
}

function itemsToCards(block: PageBlock) {
  return block.items.map((item) => ({
    eyebrow: "",
    title: item.label,
    body: item.description,
    image: item.image ?? "",
    link: { ...emptyLink, href: item.href },
  }));
}

function convertBlock(block: PageBlock): BuilderElement | null {
  const design = block.design ?? {};

  switch (block.kind) {
    case "rich_text":
      return section([element("container", { gap: 16 }, textStack(block))], design);

    case "hero":
      return section([element("hero")], design);

    case "featured":
      return section(
        [
          ...(block.content["heading"]
            ? [element("heading", { text: block.content["heading"], accentDot: true })]
            : []),
          element("products", { filter: "featured", columns: 3 }),
        ],
        design,
      );

    case "categories":
      return section(
        [
          ...(block.content["categories.heading"]
            ? [element("heading", { text: block.content["categories.heading"], accentDot: true })]
            : []),
          block.items.length
            ? element("categories", { source: "custom", items: itemsToCards(block) })
            : element("categories", { source: "catalog", columns: 4 }),
        ],
        design,
      );

    case "promo":
      return section(
        [
          element("container", { gap: 20 }, [
            ...(block.content["promo.eyebrow"]
              ? [element("eyebrow", { text: block.content["promo.eyebrow"] })]
              : []),
            ...(block.content["promo.heading"]
              ? [element("heading", { text: block.content["promo.heading"], accentDot: true })]
              : []),
            ...(block.content["promo.body"]
              ? [element("text", { text: block.content["promo.body"] })]
              : []),
            element("button", {
              label: block.content["promo.cta_label"] ?? "Get a bulk estimate",
              link: { ...emptyLink, action: "start_project" },
            }),
          ]),
        ],
        design,
      );

    case "value_props": {
      // v1 stored these as `value_props.<n>.title` / `.body` pairs.
      const cards: PropsRecord[] = [];
      for (let index = 0; index < 12; index += 1) {
        const title = block.content[`value_props.${index}.title`];
        const body = block.content[`value_props.${index}.body`];
        if (!title && !body) continue;
        cards.push({
          eyebrow: "",
          title: title ?? "",
          body: body ?? "",
          image: "",
          link: emptyLink,
        });
      }
      return section([element("cards", { columns: 3, variant: "plain", items: cards })], design);
    }

    case "services":
      return section([element("services", { columns: 2 })], design);

    case "projects":
      return section(
        [
          ...(block.content["heading"]
            ? [element("heading", { text: block.content["heading"] })]
            : []),
          element("projects", { columns: 2 }),
        ],
        design,
      );

    case "contact_form":
      return section(
        [
          element("container", { gap: 20 }, [
            ...(block.content["heading"]
              ? [element("heading", { text: block.content["heading"], accentDot: true })]
              : []),
            element("form", { label: "Start the brief" }),
          ]),
        ],
        design,
      );

    case "founders": {
      const cards = [1, 2, 3].map((n) => ({
        eyebrow: block.content[`founder_${n}_role`] ?? "",
        title: block.content[`founder_${n}_name`] ?? "",
        body: block.content[`founder_${n}_bio`] ?? "",
        image: block.content[`founder_${n}_image`] ?? "",
        link: emptyLink,
      }));
      return section([...textStack(block), element("cards", { columns: 3, items: cards })], design);
    }

    case "container":
    case "columns": {
      const children = (block.children ?? [])
        .map(convertBlock)
        .filter((child): child is BuilderElement => Boolean(child))
        // A converted child is already a section; unwrap it so nesting stays flat.
        .flatMap((child) => (child.type === "section" ? child.children : [child]));
      return section(
        [
          block.kind === "columns"
            ? element("grid", { columns: 2, tabletColumns: 2, mobileColumns: 1 }, children)
            : element("container", { gap: 24 }, children),
        ],
        design,
      );
    }

    default:
      return null;
  }
}

export function migrateDocument(input: PageDocument): BuilderDocument {
  const root: BuilderElement[] = [];
  for (const block of input.blocks) {
    const converted = convertBlock(block);
    if (!converted) continue;
    root.push({
      ...converted,
      label: block.label,
      visibility: {
        base: block.visible !== false,
        tablet: block.visible !== false,
        mobile: block.mobileVisible !== false && block.visible !== false,
      },
    });
  }

  return {
    version: 2,
    pageId: input.pageId,
    title: input.title,
    description: input.description,
    root,
    seo: {
      title: input.seo?.title ?? "",
      description: input.seo?.description ?? "",
      canonical: input.seo?.canonical ?? "",
      ogTitle: input.seo?.ogTitle ?? "",
      ogDescription: input.seo?.ogDescription ?? "",
      ogImage: input.seo?.ogImage ?? "",
      twitterCard: input.seo?.twitterCard ?? "summary_large_image",
      noindex: false,
    },
  };
}

/**
 * Accepts whatever is stored for a page — a v2 document, a legacy v1 document,
 * or nothing at all — and always returns something the builder can open.
 */
export function toBuilderDocument(input: unknown, pageId: PageId): BuilderDocument {
  if (isBuilderDocument(input)) return input;
  // The global regions are builder-native — they have no legacy equivalent.
  if (isRegionId(pageId)) return defaultRegionDocument(pageId);
  const legacy =
    input && typeof input === "object" && "blocks" in input
      ? (input as PageDocument)
      : getDefaultPageDocument(pageId);
  return migrateDocument(legacy);
}
