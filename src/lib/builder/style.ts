import type { CSSProperties } from "react";

import { propBoolean, propNumber, propString } from "@/lib/builder/fields";
import {
  BREAKPOINTS,
  breakpointMeta,
  type BuilderElement,
  type Breakpoint,
  type StyleBag,
} from "@/lib/builder/types";

/**
 * The style controls the inspector offers, grouped for the Style tab. Values
 * are written straight into the element's per-breakpoint style bag as CSS.
 */
export const styleControls = [
  {
    label: "Spacing",
    controls: [
      { key: "paddingTop", label: "Padding top", unit: "px", max: 240 },
      { key: "paddingBottom", label: "Padding bottom", unit: "px", max: 240 },
      { key: "paddingLeft", label: "Padding left", unit: "px", max: 240 },
      { key: "paddingRight", label: "Padding right", unit: "px", max: 240 },
      { key: "marginTop", label: "Margin top", unit: "px", max: 240 },
      { key: "marginBottom", label: "Margin bottom", unit: "px", max: 240 },
    ],
  },
  {
    label: "Typography",
    controls: [
      { key: "fontSize", label: "Font size", unit: "px", max: 160 },
      { key: "lineHeight", label: "Line height", unit: "", max: 3, step: 0.05 },
      { key: "letterSpacing", label: "Letter spacing", unit: "em", max: 1, step: 0.01 },
      { key: "fontWeight", label: "Font weight", unit: "", max: 900, step: 100 },
    ],
  },
  {
    label: "Colour",
    controls: [
      { key: "color", label: "Text", type: "color" },
      { key: "backgroundColor", label: "Background", type: "color" },
      { key: "borderColor", label: "Border", type: "color" },
    ],
  },
  {
    label: "Border & shape",
    controls: [
      { key: "borderRadius", label: "Corner radius", unit: "px", max: 80 },
      { key: "borderWidth", label: "Border width", unit: "px", max: 12 },
      { key: "opacity", label: "Opacity", unit: "", max: 1, step: 0.05 },
    ],
  },
  {
    label: "Size",
    controls: [
      { key: "width", label: "Width", unit: "px", max: 1600 },
      { key: "maxWidth", label: "Max width", unit: "px", max: 1600 },
      { key: "minHeight", label: "Min height", unit: "px", max: 1200 },
    ],
  },
] as const;

const cssPropertyPattern = /^[a-zA-Z-]{1,64}$/;
// Blocks `expression()`, `url(javascript:…)` and friends from reaching the page.
const unsafeValuePattern = /(javascript:|expression\(|<\/?script)/i;

function toKebab(property: string) {
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function safeDeclarations(bag: StyleBag): string[] {
  return Object.entries(bag)
    .filter(([property, value]) => {
      if (!cssPropertyPattern.test(property)) return false;
      if (typeof value !== "string" || !value.trim()) return false;
      return !unsafeValuePattern.test(value);
    })
    .map(([property, value]) => `${toKebab(property)}: ${value};`);
}

/**
 * Emits a scoped stylesheet for one element: base rules plus a media query per
 * smaller breakpoint. Inline styles cannot express media queries, which is why
 * responsive editing needs real CSS rather than a style attribute.
 */
export function elementCss(element: BuilderElement): string {
  const selector = `[data-builder-id="${element.id}"]`;
  const chunks: string[] = [];

  for (const breakpoint of BREAKPOINTS) {
    const bag = element.style[breakpoint];
    const declarations = bag ? safeDeclarations(bag) : [];
    const hidden = element.visibility[breakpoint] === false;
    if (hidden) declarations.push("display: none !important;");
    if (!declarations.length) continue;

    const rule = `${selector} { ${declarations.join(" ")} }`;
    const media = breakpointMeta[breakpoint].media;
    chunks.push(media ? `@media ${media} { ${rule} }` : rule);
  }

  return chunks.join("\n");
}

export function documentCss(root: BuilderElement[]): string {
  const collect = (elements: BuilderElement[]): string[] =>
    elements.flatMap((element) => [elementCss(element), ...collect(element.children)]);
  return collect(root).filter(Boolean).join("\n");
}

/**
 * Style that comes from a widget's own props rather than the style bag —
 * flex direction, grid columns and so on. Kept separate so the Style tab never
 * fights with the Content tab over the same declaration.
 */
export function layoutStyle(element: BuilderElement): CSSProperties {
  const props = element.props;
  switch (element.type) {
    case "container": {
      const justifyMap: Record<string, string> = {
        start: "flex-start",
        center: "center",
        end: "flex-end",
        between: "space-between",
      };
      const alignMap: Record<string, string> = {
        stretch: "stretch",
        start: "flex-start",
        center: "center",
        end: "flex-end",
      };
      return {
        display: "flex",
        flexDirection: propString(props, "direction", "column") === "row" ? "row" : "column",
        gap: `${propNumber(props, "gap", 16)}px`,
        alignItems: alignMap[propString(props, "align", "stretch")] ?? "stretch",
        justifyContent: justifyMap[propString(props, "justify", "start")] ?? "flex-start",
        flexWrap: propBoolean(props, "wrap") ? "wrap" : "nowrap",
      };
    }
    case "grid":
      return {
        display: "grid",
        gridTemplateColumns: `repeat(${propNumber(props, "columns", 3)}, minmax(0, 1fr))`,
        gap: `${propNumber(props, "gap", 20)}px`,
      };
    default:
      return {};
  }
}

/**
 * Grid widgets need their column counts to change per breakpoint, which again
 * requires real media queries rather than inline style.
 */
export function layoutCss(element: BuilderElement): string {
  if (element.type !== "grid") return "";
  const selector = `[data-builder-id="${element.id}"]`;
  const tablet = propNumber(element.props, "tabletColumns", 2);
  const mobile = propNumber(element.props, "mobileColumns", 1);
  return [
    `@media ${breakpointMeta.tablet.media} { ${selector} { grid-template-columns: repeat(${tablet}, minmax(0, 1fr)); } }`,
    `@media ${breakpointMeta.mobile.media} { ${selector} { grid-template-columns: repeat(${mobile}, minmax(0, 1fr)); } }`,
  ].join("\n");
}

export function documentLayoutCss(root: BuilderElement[]): string {
  const collect = (elements: BuilderElement[]): string[] =>
    elements.flatMap((element) => [layoutCss(element), ...collect(element.children)]);
  return collect(root).filter(Boolean).join("\n");
}

/** Style for the breakpoint currently being edited, for canvas previews. */
export function previewStyle(element: BuilderElement, breakpoint: Breakpoint): CSSProperties {
  const merged: StyleBag = {
    ...(element.style.base ?? {}),
    ...(breakpoint !== "base" ? (element.style.tablet ?? {}) : {}),
    ...(breakpoint === "mobile" ? (element.style.mobile ?? {}) : {}),
  };
  return merged as CSSProperties;
}
