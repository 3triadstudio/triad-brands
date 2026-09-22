import type { FieldGroup } from "@/lib/builder/fields";
import {
  emptyLink,
  type BuilderElement,
  type PropsRecord,
  type ResponsiveStyle,
} from "@/lib/builder/types";

export type WidgetCategory = "layout" | "basic" | "media" | "navigation" | "dynamic";

export type WidgetDefinition = {
  type: string;
  label: string;
  detail: string;
  category: WidgetCategory;
  /** Lucide icon name, resolved in the UI. */
  icon: string;
  /** Layout widgets accept children; leaves do not. */
  container: boolean;
  /** Which child types may be dropped inside. `null` means anything. */
  accepts?: readonly string[] | null;
  defaultProps: PropsRecord;
  defaultStyle?: ResponsiveStyle;
  fields: ReadonlyArray<FieldGroup>;
  /** Bound to a live collection — content comes from the database, not props. */
  dynamic?: boolean;
};

const linkField = (key: string, label: string) => ({ kind: "link" as const, key, label });

const alignOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
] as const;

export const widgetDefinitions: WidgetDefinition[] = [
  /* ----------------------------- layout ----------------------------- */
  {
    type: "section",
    label: "Section",
    detail: "Full-width band with its own background",
    category: "layout",
    icon: "Rows3",
    container: true,
    accepts: null,
    defaultProps: { maxWidth: "1400", tag: "section" },
    defaultStyle: { base: { paddingTop: "80px", paddingBottom: "80px" } },
    fields: [
      {
        label: "Layout",
        fields: [
          {
            kind: "select",
            key: "maxWidth",
            label: "Content width",
            options: [
              { value: "1400", label: "Standard (1400px)" },
              { value: "1120", label: "Narrow (1120px)" },
              { value: "full", label: "Full width" },
            ],
          },
          {
            kind: "select",
            key: "tag",
            label: "HTML tag",
            options: [
              { value: "section", label: "section" },
              { value: "header", label: "header" },
              { value: "footer", label: "footer" },
              { value: "div", label: "div" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "container",
    label: "Container",
    detail: "Flex group for arranging widgets",
    category: "layout",
    icon: "Box",
    container: true,
    accepts: null,
    defaultProps: { direction: "column", gap: "16", align: "stretch", justify: "start" },
    fields: [
      {
        label: "Flex",
        fields: [
          {
            kind: "select",
            key: "direction",
            label: "Direction",
            options: [
              { value: "column", label: "Vertical" },
              { value: "row", label: "Horizontal" },
            ],
          },
          { kind: "number", key: "gap", label: "Gap (px)", min: 0, max: 160, step: 2 },
          {
            kind: "select",
            key: "align",
            label: "Align",
            options: [
              { value: "stretch", label: "Stretch" },
              { value: "start", label: "Start" },
              { value: "center", label: "Center" },
              { value: "end", label: "End" },
            ],
          },
          {
            kind: "select",
            key: "justify",
            label: "Justify",
            options: [
              { value: "start", label: "Start" },
              { value: "center", label: "Center" },
              { value: "end", label: "End" },
              { value: "between", label: "Space between" },
            ],
          },
          { kind: "toggle", key: "wrap", label: "Wrap items" },
        ],
      },
    ],
  },
  {
    type: "grid",
    label: "Grid",
    detail: "Responsive column grid",
    category: "layout",
    icon: "LayoutGrid",
    container: true,
    accepts: null,
    defaultProps: { columns: 3, tabletColumns: 2, mobileColumns: 1, gap: "20" },
    fields: [
      {
        label: "Columns",
        fields: [
          { kind: "number", key: "columns", label: "Desktop columns", min: 1, max: 6 },
          { kind: "number", key: "tabletColumns", label: "Tablet columns", min: 1, max: 4 },
          { kind: "number", key: "mobileColumns", label: "Mobile columns", min: 1, max: 2 },
          { kind: "number", key: "gap", label: "Gap (px)", min: 0, max: 80, step: 2 },
        ],
      },
    ],
  },

  /* ------------------------------ basic ----------------------------- */
  {
    type: "heading",
    label: "Heading",
    detail: "Display or section title",
    category: "basic",
    icon: "Heading",
    container: false,
    defaultProps: { text: "Add a strong headline", level: "h2", display: true, align: "left" },
    fields: [
      {
        label: "Content",
        fields: [
          { kind: "textarea", key: "text", label: "Text", rows: 2 },
          {
            kind: "select",
            key: "level",
            label: "Level",
            options: [
              { value: "h1", label: "H1" },
              { value: "h2", label: "H2" },
              { value: "h3", label: "H3" },
              { value: "h4", label: "H4" },
            ],
          },
          {
            kind: "toggle",
            key: "display",
            label: "Display typeface",
            help: "Uses the brand display font",
          },
          { kind: "select", key: "align", label: "Alignment", options: alignOptions },
          {
            kind: "toggle",
            key: "accentDot",
            label: "Accent full stop",
            help: "Adds the brand-coloured period",
          },
        ],
      },
    ],
  },
  {
    type: "text",
    label: "Text",
    detail: "Paragraph copy",
    category: "basic",
    icon: "Type",
    container: false,
    defaultProps: {
      text: "Write something useful here.",
      size: "base",
      muted: true,
      align: "left",
    },
    fields: [
      {
        label: "Content",
        fields: [
          { kind: "textarea", key: "text", label: "Text", rows: 5 },
          {
            kind: "select",
            key: "size",
            label: "Size",
            options: [
              { value: "sm", label: "Small" },
              { value: "base", label: "Base" },
              { value: "lg", label: "Large" },
            ],
          },
          { kind: "toggle", key: "muted", label: "Muted colour" },
          { kind: "select", key: "align", label: "Alignment", options: alignOptions },
        ],
      },
    ],
  },
  {
    type: "eyebrow",
    label: "Eyebrow",
    detail: "Small mono label above a heading",
    category: "basic",
    icon: "Tag",
    container: false,
    defaultProps: { text: "Section label", accent: true },
    fields: [
      {
        label: "Content",
        fields: [
          { kind: "text", key: "text", label: "Text" },
          { kind: "toggle", key: "accent", label: "Accent colour" },
        ],
      },
    ],
  },
  {
    type: "button",
    label: "Button",
    detail: "Call to action",
    category: "basic",
    icon: "MousePointerClick",
    container: false,
    defaultProps: {
      label: "Start a project",
      link: emptyLink,
      variant: "accent",
      size: "md",
      icon: "ArrowUpRight",
      fullWidth: false,
    },
    fields: [
      {
        label: "Content",
        fields: [
          { kind: "text", key: "label", label: "Label" },
          linkField("link", "Link"),
          { kind: "icon", key: "icon", label: "Icon" },
        ],
      },
      {
        label: "Appearance",
        fields: [
          {
            kind: "select",
            key: "variant",
            label: "Style",
            options: [
              { value: "accent", label: "Accent" },
              { value: "primary", label: "Primary" },
              { value: "outline", label: "Outline" },
              { value: "ghost", label: "Ghost" },
              { value: "link", label: "Text link" },
            ],
          },
          {
            kind: "select",
            key: "size",
            label: "Size",
            options: [
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ],
          },
          {
            kind: "select",
            key: "shape",
            label: "Shape",
            options: [
              { value: "pill", label: "Pill" },
              { value: "rounded", label: "Rounded" },
              { value: "square", label: "Square" },
            ],
          },
          { kind: "toggle", key: "fullWidth", label: "Full width" },
        ],
      },
    ],
  },
  {
    type: "list",
    label: "List",
    detail: "Bulleted or chip list",
    category: "basic",
    icon: "List",
    container: false,
    defaultProps: {
      style: "chips",
      items: [{ text: "First item" }, { text: "Second item" }],
    },
    fields: [
      {
        label: "Items",
        fields: [
          {
            kind: "select",
            key: "style",
            label: "Style",
            options: [
              { value: "chips", label: "Chips" },
              { value: "bullets", label: "Bullets" },
              { value: "checks", label: "Check marks" },
              { value: "plain", label: "Plain" },
            ],
          },
          {
            kind: "repeater",
            key: "items",
            label: "Items",
            itemLabel: "Item",
            max: 40,
            fields: [{ kind: "text", key: "text", label: "Text" }],
          },
        ],
      },
    ],
  },
  {
    type: "cards",
    label: "Cards",
    detail: "Repeatable content cards",
    category: "basic",
    icon: "LayoutPanelTop",
    container: false,
    defaultProps: {
      columns: 3,
      items: [
        {
          eyebrow: "01",
          title: "First point",
          body: "Explain it here.",
          image: "",
          link: emptyLink,
        },
        {
          eyebrow: "02",
          title: "Second point",
          body: "Explain it here.",
          image: "",
          link: emptyLink,
        },
        {
          eyebrow: "03",
          title: "Third point",
          body: "Explain it here.",
          image: "",
          link: emptyLink,
        },
      ],
    },
    fields: [
      {
        label: "Cards",
        fields: [
          { kind: "number", key: "columns", label: "Columns", min: 1, max: 4 },
          {
            kind: "select",
            key: "variant",
            label: "Card style",
            options: [
              { value: "soft", label: "Soft card" },
              { value: "bordered", label: "Bordered" },
              { value: "plain", label: "Plain" },
            ],
          },
          {
            kind: "repeater",
            key: "items",
            label: "Cards",
            itemLabel: "Card",
            max: 24,
            fields: [
              { kind: "text", key: "eyebrow", label: "Eyebrow" },
              { kind: "text", key: "title", label: "Title" },
              { kind: "textarea", key: "body", label: "Body", rows: 3 },
              { kind: "image", key: "image", label: "Image" },
              { kind: "link", key: "link", label: "Link" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "stats",
    label: "Stats",
    detail: "Number and label pairs",
    category: "basic",
    icon: "Hash",
    container: false,
    defaultProps: {
      columns: 4,
      items: [
        { value: "4", label: "Disciplines under one roof" },
        { value: "1 day", label: "Typical reply to a new brief" },
      ],
    },
    fields: [
      {
        label: "Stats",
        fields: [
          { kind: "number", key: "columns", label: "Columns", min: 2, max: 4 },
          {
            kind: "repeater",
            key: "items",
            label: "Stats",
            itemLabel: "Stat",
            max: 12,
            fields: [
              { kind: "text", key: "value", label: "Value" },
              { kind: "text", key: "label", label: "Label" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "accordion",
    label: "Accordion",
    detail: "FAQ or disclosure list",
    category: "basic",
    icon: "ChevronsUpDown",
    container: false,
    defaultProps: {
      items: [{ question: "A question?", answer: "The answer." }],
      emitFaqSchema: true,
    },
    fields: [
      {
        label: "Items",
        fields: [
          {
            kind: "repeater",
            key: "items",
            label: "Questions",
            itemLabel: "Question",
            max: 40,
            fields: [
              { kind: "text", key: "question", label: "Question" },
              { kind: "textarea", key: "answer", label: "Answer", rows: 3 },
            ],
          },
          {
            kind: "toggle",
            key: "emitFaqSchema",
            label: "Emit FAQ structured data",
            help: "Publishes these as FAQPage schema for rich results",
          },
        ],
      },
    ],
  },
  {
    type: "spacer",
    label: "Spacer",
    detail: "Vertical gap",
    category: "layout",
    icon: "MoveVertical",
    container: false,
    defaultProps: { height: 48 },
    fields: [
      {
        label: "Size",
        fields: [
          { kind: "number", key: "height", label: "Height (px)", min: 0, max: 400, step: 4 },
        ],
      },
    ],
  },
  {
    type: "divider",
    label: "Divider",
    detail: "Horizontal rule",
    category: "layout",
    icon: "Minus",
    container: false,
    defaultProps: { thickness: 1 },
    fields: [
      {
        label: "Style",
        fields: [
          { kind: "number", key: "thickness", label: "Thickness (px)", min: 1, max: 8 },
          { kind: "color", key: "color", label: "Colour" },
        ],
      },
    ],
  },

  /* ------------------------------ media ----------------------------- */
  {
    type: "image",
    label: "Image",
    detail: "Picture with alt text",
    category: "media",
    icon: "Image",
    container: false,
    defaultProps: { src: "", alt: "", ratio: "16/9", fit: "cover", rounded: true, link: emptyLink },
    fields: [
      {
        label: "Image",
        fields: [
          { kind: "image", key: "src", label: "Source" },
          {
            kind: "text",
            key: "alt",
            label: "Alt text",
            help: "Describe the image for screen readers and search engines",
          },
          linkField("link", "Link"),
        ],
      },
      {
        label: "Appearance",
        fields: [
          {
            kind: "select",
            key: "ratio",
            label: "Aspect ratio",
            options: [
              { value: "auto", label: "Original" },
              { value: "16/9", label: "16:9" },
              { value: "4/3", label: "4:3" },
              { value: "1/1", label: "Square" },
              { value: "3/4", label: "Portrait" },
            ],
          },
          {
            kind: "select",
            key: "fit",
            label: "Fit",
            options: [
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
            ],
          },
          { kind: "toggle", key: "rounded", label: "Rounded corners" },
        ],
      },
    ],
  },
  {
    type: "logo",
    label: "Logo",
    detail: "Brand logo with variant",
    category: "media",
    icon: "Sparkles",
    container: false,
    defaultProps: { variant: "onWhite", height: 36, link: { ...emptyLink, href: "/" } },
    fields: [
      {
        label: "Logo",
        fields: [
          {
            kind: "select",
            key: "variant",
            label: "Variant",
            options: [
              { value: "onWhite", label: "On light" },
              { value: "onDark", label: "On dark" },
              { value: "onRed", label: "On red" },
              { value: "onYellow", label: "On yellow" },
              { value: "custom", label: "Custom upload" },
            ],
          },
          { kind: "image", key: "custom", label: "Custom logo" },
          { kind: "number", key: "height", label: "Height (px)", min: 16, max: 160 },
          linkField("link", "Link"),
        ],
      },
    ],
  },
  {
    type: "icon",
    label: "Icon",
    detail: "Single icon in a tile",
    category: "media",
    icon: "Star",
    container: false,
    defaultProps: { icon: "Sparkles", size: 20, tile: true, link: emptyLink },
    fields: [
      {
        label: "Icon",
        fields: [
          { kind: "icon", key: "icon", label: "Icon" },
          { kind: "number", key: "size", label: "Size (px)", min: 12, max: 72 },
          { kind: "toggle", key: "tile", label: "Show tile background" },
          { kind: "color", key: "color", label: "Colour" },
          linkField("link", "Link"),
        ],
      },
    ],
  },
  {
    type: "video",
    label: "Video",
    detail: "Embedded or hosted video",
    category: "media",
    icon: "Play",
    container: false,
    defaultProps: { src: "", poster: "", autoplay: false, loop: true, muted: true, controls: true },
    fields: [
      {
        label: "Video",
        fields: [
          { kind: "text", key: "src", label: "Video URL" },
          { kind: "image", key: "poster", label: "Poster image" },
          { kind: "toggle", key: "controls", label: "Show controls" },
          { kind: "toggle", key: "autoplay", label: "Autoplay" },
          { kind: "toggle", key: "loop", label: "Loop" },
          { kind: "toggle", key: "muted", label: "Muted" },
        ],
      },
    ],
  },

  /* --------------------------- navigation --------------------------- */
  {
    type: "nav",
    label: "Navigation",
    detail: "Menu of links",
    category: "navigation",
    icon: "Menu",
    container: false,
    defaultProps: {
      source: "settings",
      direction: "row",
      items: [{ label: "About", link: { ...emptyLink, href: "/about" } }],
    },
    fields: [
      {
        label: "Menu",
        fields: [
          {
            kind: "select",
            key: "source",
            label: "Source",
            options: [
              { value: "settings", label: "Site navigation (global)" },
              { value: "custom", label: "Custom list" },
            ],
          },
          {
            kind: "select",
            key: "direction",
            label: "Direction",
            options: [
              { value: "row", label: "Horizontal" },
              { value: "column", label: "Vertical" },
            ],
          },
          {
            kind: "repeater",
            key: "items",
            label: "Links",
            itemLabel: "Link",
            max: 24,
            fields: [
              { kind: "text", key: "label", label: "Label" },
              { kind: "link", key: "link", label: "Destination" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "social",
    label: "Social links",
    detail: "Icon row from social settings",
    category: "navigation",
    icon: "Share2",
    container: false,
    defaultProps: { source: "settings", showLabels: false, size: 18 },
    fields: [
      {
        label: "Links",
        fields: [
          {
            kind: "select",
            key: "source",
            label: "Source",
            options: [
              { value: "settings", label: "Managed social links" },
              { value: "custom", label: "Custom list" },
            ],
          },
          { kind: "toggle", key: "showLabels", label: "Show labels" },
          { kind: "number", key: "size", label: "Icon size (px)", min: 12, max: 40 },
          {
            kind: "repeater",
            key: "items",
            label: "Custom links",
            itemLabel: "Link",
            max: 12,
            fields: [
              { kind: "text", key: "label", label: "Label" },
              { kind: "icon", key: "icon", label: "Icon" },
              { kind: "link", key: "link", label: "Destination" },
            ],
          },
        ],
      },
    ],
  },

  /* ---------------------------- dynamic ----------------------------- */
  {
    type: "products",
    label: "Product grid",
    detail: "Live catalog products",
    category: "dynamic",
    icon: "Package",
    container: false,
    dynamic: true,
    defaultProps: { filter: "featured", limit: 6, columns: 3, showPrice: true },
    fields: [
      {
        label: "Source",
        fields: [
          {
            kind: "select",
            key: "filter",
            label: "Show",
            options: [
              { value: "featured", label: "Featured products" },
              { value: "all", label: "All products" },
              { value: "category", label: "One category" },
            ],
          },
          { kind: "text", key: "category", label: "Category name" },
          { kind: "number", key: "limit", label: "Maximum items", min: 1, max: 24 },
          { kind: "number", key: "columns", label: "Columns", min: 1, max: 4 },
          { kind: "toggle", key: "showPrice", label: "Show price" },
        ],
      },
    ],
  },
  {
    type: "categories",
    label: "Category grid",
    detail: "Catalog categories",
    category: "dynamic",
    icon: "Grid2x2",
    container: false,
    dynamic: true,
    defaultProps: { columns: 4, source: "catalog" },
    fields: [
      {
        label: "Source",
        fields: [
          {
            kind: "select",
            key: "source",
            label: "Source",
            options: [
              { value: "catalog", label: "Live catalog categories" },
              { value: "custom", label: "Custom cards" },
            ],
          },
          { kind: "number", key: "columns", label: "Columns", min: 2, max: 4 },
          {
            kind: "repeater",
            key: "items",
            label: "Custom cards",
            itemLabel: "Category",
            max: 12,
            fields: [
              { kind: "text", key: "label", label: "Name" },
              { kind: "textarea", key: "description", label: "Description", rows: 2 },
              { kind: "image", key: "image", label: "Image" },
              { kind: "icon", key: "icon", label: "Icon" },
              { kind: "link", key: "link", label: "Link" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "services",
    label: "Services",
    detail: "Managed services collection",
    category: "dynamic",
    icon: "Wrench",
    container: false,
    dynamic: true,
    defaultProps: { columns: 2, limit: 12 },
    fields: [
      {
        label: "Source",
        fields: [
          { kind: "number", key: "columns", label: "Columns", min: 1, max: 3 },
          { kind: "number", key: "limit", label: "Maximum items", min: 1, max: 24 },
        ],
      },
    ],
  },
  {
    type: "projects",
    label: "Work",
    detail: "Managed portfolio projects",
    category: "dynamic",
    icon: "Briefcase",
    container: false,
    dynamic: true,
    defaultProps: { columns: 2, limit: 6 },
    fields: [
      {
        label: "Source",
        fields: [
          { kind: "number", key: "columns", label: "Columns", min: 1, max: 3 },
          { kind: "number", key: "limit", label: "Maximum items", min: 1, max: 24 },
        ],
      },
    ],
  },
  {
    type: "hero",
    label: "Hero carousel",
    detail: "Managed hero slides",
    category: "dynamic",
    icon: "GalleryHorizontal",
    container: false,
    dynamic: true,
    defaultProps: { showTrustBadges: true, minHeight: 560 },
    fields: [
      {
        label: "Hero",
        fields: [
          { kind: "toggle", key: "showTrustBadges", label: "Show trust badges" },
          { kind: "number", key: "minHeight", label: "Minimum height (px)", min: 320, max: 900 },
        ],
      },
    ],
  },
  {
    type: "form",
    label: "Enquiry form",
    detail: "Project brief dialog trigger",
    category: "dynamic",
    icon: "Send",
    container: false,
    defaultProps: { label: "Start the brief", variant: "accent" },
    fields: [
      {
        label: "Form",
        fields: [
          { kind: "text", key: "label", label: "Button label" },
          {
            kind: "select",
            key: "variant",
            label: "Style",
            options: [
              { value: "accent", label: "Accent" },
              { value: "primary", label: "Primary" },
              { value: "outline", label: "Outline" },
            ],
          },
        ],
      },
    ],
  },
];

export const widgetsByType = new Map(widgetDefinitions.map((widget) => [widget.type, widget]));

export function getWidget(type: string): WidgetDefinition | undefined {
  return widgetsByType.get(type);
}

export function widgetLabel(element: BuilderElement): string {
  if (element.label) return element.label;
  return getWidget(element.type)?.label ?? element.type;
}

export const widgetCategories: Array<{ id: WidgetCategory; label: string }> = [
  { id: "layout", label: "Layout" },
  { id: "basic", label: "Basic" },
  { id: "media", label: "Media" },
  { id: "navigation", label: "Navigation" },
  { id: "dynamic", label: "Dynamic" },
];

/** Builds a fresh element for the canvas from a widget type. */
export function createWidgetElement(type: string, id: string): BuilderElement {
  const definition = getWidget(type);
  return {
    id,
    type,
    props: structuredClone(definition?.defaultProps ?? {}),
    style: structuredClone(definition?.defaultStyle ?? {}),
    visibility: {},
    children: [],
  };
}
