import { z } from "zod";

import { pageIdSchema, type PageId } from "@/lib/page-editor";

/* ------------------------------------------------------------------ */
/* Breakpoints                                                         */
/* ------------------------------------------------------------------ */

/**
 * Three editing surfaces, mirroring the Tailwind breakpoints the storefront
 * already uses. `base` is desktop-first authoring; `tablet` and `mobile`
 * override it downwards, which is how every visual builder behaves.
 */
export const BREAKPOINTS = ["base", "tablet", "mobile"] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

export const breakpointMeta: Record<
  Breakpoint,
  { label: string; maxWidth: number | null; media: string | null }
> = {
  base: { label: "Desktop", maxWidth: null, media: null },
  tablet: { label: "Tablet", maxWidth: 1024, media: "(max-width: 1024px)" },
  mobile: { label: "Mobile", maxWidth: 640, media: "(max-width: 640px)" },
};

/* ------------------------------------------------------------------ */
/* Style                                                               */
/* ------------------------------------------------------------------ */

/**
 * A style bag is a plain CSS property map. It is intentionally open-ended:
 * the inspector writes a curated subset, but hand-authored documents and
 * future controls can carry anything without a schema migration.
 */
/** JSON-safe value. Widget props cross the server boundary, so `unknown` is not
 * good enough — TanStack refuses to serialise it. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type PropsRecord = Record<string, JsonValue>;

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
) as z.ZodType<JsonValue>;

export const styleBagSchema = z.record(z.string().max(64), z.string().max(400));
export type StyleBag = z.infer<typeof styleBagSchema>;

export const responsiveStyleSchema = z
  .object({
    base: styleBagSchema.default({}),
    tablet: styleBagSchema.default({}),
    mobile: styleBagSchema.default({}),
  })
  .partial()
  .default({});
export type ResponsiveStyle = { [K in Breakpoint]?: StyleBag };

export const visibilitySchema = z
  .object({
    base: z.boolean().default(true),
    tablet: z.boolean().default(true),
    mobile: z.boolean().default(true),
  })
  .partial()
  .default({});
export type Visibility = { [K in Breakpoint]?: boolean };

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

export const linkSchema = z.object({
  href: z.string().max(600).default(""),
  target: z.enum(["_self", "_blank"]).default("_self"),
  rel: z.string().max(120).default(""),
  /** Opens the project-brief dialog instead of navigating. */
  action: z.enum(["navigate", "start_project", "scroll_to", "whatsapp"]).default("navigate"),
});
export type LinkValue = z.infer<typeof linkSchema>;

export const emptyLink: LinkValue = {
  href: "",
  target: "_self",
  rel: "",
  action: "navigate",
};

/* ------------------------------------------------------------------ */
/* Elements                                                            */
/* ------------------------------------------------------------------ */

/**
 * Every node on a page is a BuilderElement. Layout nodes (section, container,
 * columns, column) carry children; widgets are leaves. `props` is validated
 * loosely here and precisely by each widget definition in the registry, so a
 * new widget never requires a change to this schema.
 */
export type BuilderElement = {
  id: string;
  type: string;
  label?: string;
  props: PropsRecord;
  style: ResponsiveStyle;
  visibility: Visibility;
  children: BuilderElement[];
  /** Set when the element mirrors a live collection (products, services…). */
  locked?: boolean;
};

export const builderElementSchema: z.ZodType<BuilderElement> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(80),
    type: z.string().min(1).max(60),
    label: z.string().max(120).optional(),
    props: z.record(z.string(), jsonValueSchema).default({}),
    style: responsiveStyleSchema,
    visibility: visibilitySchema,
    children: z.array(builderElementSchema).max(200).default([]),
    locked: z.boolean().optional(),
  }),
) as z.ZodType<BuilderElement>;

/* ------------------------------------------------------------------ */
/* Document                                                            */
/* ------------------------------------------------------------------ */

export const builderSeoSchema = z.object({
  title: z.string().max(160).default(""),
  description: z.string().max(320).default(""),
  canonical: z.string().max(300).default(""),
  ogTitle: z.string().max(160).default(""),
  ogDescription: z.string().max(320).default(""),
  ogImage: z.string().max(600).default(""),
  twitterCard: z.enum(["summary", "summary_large_image"]).default("summary_large_image"),
  noindex: z.boolean().default(false),
});
export type BuilderSeo = z.infer<typeof builderSeoSchema>;

export type BuilderDocument = {
  version: 2;
  pageId: PageId;
  title: string;
  description: string;
  root: BuilderElement[];
  seo: BuilderSeo;
};

export const builderDocumentSchema: z.ZodType<BuilderDocument> = z.object({
  version: z.literal(2),
  pageId: pageIdSchema,
  title: z.string().min(1).max(160),
  description: z.string().max(320).default(""),
  root: z.array(builderElementSchema).max(200),
  seo: builderSeoSchema,
}) as z.ZodType<BuilderDocument>;

/**
 * Identifies a builder document structurally, by the presence of an element
 * tree — not by the version number alone.
 *
 * `version` is not a reliable marker on its own: the policy pages were seeded
 * by an older migration with `"version": 2` while keeping the legacy `blocks`
 * shape, so a numeric check misreads them as builder documents and their
 * published content is discarded.
 */
export function isBuilderDocument(input: unknown): input is BuilderDocument {
  if (!input || typeof input !== "object") return false;
  const candidate = input as { version?: unknown; root?: unknown };
  return candidate.version === 2 && Array.isArray(candidate.root);
}

/* ------------------------------------------------------------------ */
/* Tree helpers                                                        */
/* ------------------------------------------------------------------ */

export function createElementId(type: string) {
  return `${type}-${Math.random().toString(36).slice(2, 9)}`;
}

export function findElement(root: BuilderElement[], id: string): BuilderElement | null {
  for (const element of root) {
    if (element.id === id) return element;
    const hit = findElement(element.children, id);
    if (hit) return hit;
  }
  return null;
}

export function findParent(
  root: BuilderElement[],
  id: string,
  parent: BuilderElement | null = null,
): { parent: BuilderElement | null; index: number } | null {
  const siblings = parent ? parent.children : root;
  const index = siblings.findIndex((element) => element.id === id);
  if (index >= 0) return { parent, index };
  for (const element of siblings) {
    const hit = findParent(root, id, element);
    if (hit) return hit;
  }
  return null;
}

export function mapElements(
  root: BuilderElement[],
  visit: (element: BuilderElement) => BuilderElement,
): BuilderElement[] {
  return root.map((element) =>
    visit({ ...element, children: mapElements(element.children, visit) }),
  );
}

export function updateElement(
  root: BuilderElement[],
  id: string,
  patch: (element: BuilderElement) => BuilderElement,
): BuilderElement[] {
  return root.map((element) => {
    if (element.id === id) return patch(element);
    if (element.children.length) {
      return { ...element, children: updateElement(element.children, id, patch) };
    }
    return element;
  });
}

export function removeElement(root: BuilderElement[], id: string): BuilderElement[] {
  return root
    .filter((element) => element.id !== id)
    .map((element) => ({ ...element, children: removeElement(element.children, id) }));
}

/** True when `ancestorId` contains `id`, used to block dropping a node into itself. */
export function isDescendant(root: BuilderElement[], ancestorId: string, id: string): boolean {
  const ancestor = findElement(root, ancestorId);
  if (!ancestor) return false;
  return Boolean(findElement(ancestor.children, id));
}

export function insertElement(
  root: BuilderElement[],
  element: BuilderElement,
  target: { parentId: string | null; index: number },
): BuilderElement[] {
  if (target.parentId === null) {
    const next = [...root];
    next.splice(Math.max(0, Math.min(target.index, next.length)), 0, element);
    return next;
  }
  return root.map((candidate) => {
    if (candidate.id === target.parentId) {
      const children = [...candidate.children];
      children.splice(Math.max(0, Math.min(target.index, children.length)), 0, element);
      return { ...candidate, children };
    }
    return { ...candidate, children: insertElement(candidate.children, element, target) };
  });
}

export function cloneElement(element: BuilderElement): BuilderElement {
  return {
    ...element,
    id: createElementId(element.type),
    children: element.children.map(cloneElement),
  };
}

export function flattenElements(
  root: BuilderElement[],
  depth = 0,
): Array<{
  element: BuilderElement;
  depth: number;
}> {
  return root.flatMap((element) => [
    { element, depth },
    ...flattenElements(element.children, depth + 1),
  ]);
}
