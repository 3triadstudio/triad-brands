import { QueryClient } from "@tanstack/react-query";
import { getDefaultPageDocument } from "@/lib/page-editor";
import { resetSiteSettingsCache } from "@/lib/storefront";
import { migrateDocument, toBuilderDocument } from "@/lib/builder/migrate";
import { defaultRegionDocument, isRegionId } from "@/lib/builder/regions";
import { createWidgetElement, getWidget, widgetDefinitions } from "@/lib/builder/registry";
import { elementCss, documentCss } from "@/lib/builder/style";
import {
  cloneElement,
  createElementId,
  findElement,
  findParent,
  insertElement,
  isDescendant,
  removeElement,
  updateElement,
  builderDocumentSchema,
  isBuilderDocument,
  type BuilderElement,
} from "@/lib/builder/types";

let failures = 0;
function check(name: string, condition: boolean, extra = "") {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name} ${extra}`);
  }
}

console.log("\n1. v1 -> v2 migration preserves content");
const legacyHome = getDefaultPageDocument("home");
const migratedHome = migrateDocument(legacyHome);
check("home migrates to version 2", migratedHome.version === 2);
check(
  "home produces sections",
  migratedHome.root.length === legacyHome.blocks.length,
  `got ${migratedHome.root.length} vs ${legacyHome.blocks.length}`,
);
check(
  "every root node is a section",
  migratedHome.root.every((n) => n.type === "section"),
);

const legacyPrivacy = getDefaultPageDocument("privacy");
const migratedPrivacy = migrateDocument(legacyPrivacy);
const headings: string[] = [];
const walk = (nodes: BuilderElement[]) => {
  for (const node of nodes) {
    if (node.type === "heading") headings.push(String(node.props["text"] ?? ""));
    walk(node.children);
  }
};
walk(migratedPrivacy.root);
const legacyHeadings = legacyPrivacy.blocks
  .map((b) => b.content["heading"])
  .filter((h): h is string => Boolean(h));
check(
  "policy headings survive migration",
  legacyHeadings.every((h) => headings.includes(h)),
  `missing: ${legacyHeadings.filter((h) => !headings.includes(h)).join(" | ")}`,
);

console.log("\n2. migrated documents validate against the schema");
for (const id of [
  "home",
  "shop",
  "solutions",
  "about",
  "contact",
  "work",
  "privacy",
  "terms",
  "cookies",
] as const) {
  const result = builderDocumentSchema.safeParse(migrateDocument(getDefaultPageDocument(id)));
  check(
    `${id} validates`,
    result.success,
    result.success ? "" : JSON.stringify(result.error.issues[0]),
  );
}

console.log("\n3. unknown / empty input still opens");
check("null input falls back", toBuilderDocument(null, "about").version === 2);
check("v2 input passes through", toBuilderDocument(migratedHome, "home") === migratedHome);

console.log("\n3b. legacy documents with a bumped version marker");
// The policy pages were seeded by migration 20260909190000 with "version": 2
// while keeping the v1 `blocks` shape. Treating that as a builder document
// discards the published copy, so detection must be structural.
const bumpedLegacy = { ...getDefaultPageDocument("cookies"), version: 2 } as unknown;
check("version 2 without root is not a builder document", !isBuilderDocument(bumpedLegacy));
check("real v2 document is detected", isBuilderDocument(migratedHome));
check(
  "version 2 + blocks migrates as legacy",
  (() => {
    const converted = toBuilderDocument(bumpedLegacy, "cookies");
    return converted.version === 2 && converted.root.length > 0;
  })(),
);
check("empty object is not a builder document", !isBuilderDocument({}));
check("array is not a builder document", !isBuilderDocument([]));
check("version 2 with root array is detected", isBuilderDocument({ version: 2, root: [] }));

console.log("\n4. tree operations");
const section = createWidgetElement("section", "sec-1");
const heading = createWidgetElement("heading", "head-1");
const button = createWidgetElement("button", "btn-1");
let root: BuilderElement[] = [{ ...section, children: [heading] }];

root = insertElement(root, button, { parentId: "sec-1", index: 1 });
check("insert into container", findElement(root, "btn-1") !== null);
check("insert respects index", root[0]!.children[1]!.id === "btn-1");

const parentInfo = findParent(root, "btn-1");
check("findParent locates container", parentInfo?.parent?.id === "sec-1" && parentInfo.index === 1);

root = updateElement(root, "head-1", (el) => ({ ...el, props: { ...el.props, text: "Changed" } }));
check("update mutates only the target", findElement(root, "head-1")!.props["text"] === "Changed");
check(
  "update leaves siblings alone",
  findElement(root, "btn-1")!.props["label"] === "Start a project",
);

check("isDescendant true for child", isDescendant(root, "sec-1", "btn-1"));
check("isDescendant false for parent", !isDescendant(root, "btn-1", "sec-1"));

const copy = cloneElement(findElement(root, "sec-1")!);
check("clone gets a new id", copy.id !== "sec-1");
check(
  "clone re-ids children",
  copy.children.every((c) => c.id !== "head-1" && c.id !== "btn-1"),
);
check("clone keeps child count", copy.children.length === 2);

root = removeElement(root, "btn-1");
check("remove deletes the node", findElement(root, "btn-1") === null);
check("remove keeps siblings", findElement(root, "head-1") !== null);

console.log("\n5. responsive CSS");
const styled: BuilderElement = {
  ...createWidgetElement("text", "t-1"),
  style: { base: { fontSize: "18px" }, mobile: { fontSize: "14px" } },
  visibility: { mobile: false },
};
const css = elementCss(styled);
check("emits base rule", css.includes('[data-builder-id="t-1"] { font-size: 18px; }'));
check("emits mobile media query", css.includes("@media (max-width: 640px)"));
check("hidden breakpoint emits display none", css.includes("display: none !important;"));
check("camelCase converts to kebab", css.includes("font-size"));

const unsafe: BuilderElement = {
  ...createWidgetElement("text", "t-2"),
  style: { base: { color: "javascript:alert(1)", "bad;prop": "red", fontSize: "16px" } },
};
const unsafeCss = elementCss(unsafe);
check("strips javascript: values", !unsafeCss.includes("javascript:"));
check("strips invalid property names", !unsafeCss.includes("bad;prop"));
check("keeps valid declarations", unsafeCss.includes("font-size: 16px"));

check(
  "documentCss walks children",
  documentCss([{ ...section, children: [styled] }]).includes("t-1"),
);

console.log("\n6. widget registry integrity");
const types = widgetDefinitions.map((w) => w.type);
check("no duplicate widget types", new Set(types).size === types.length);
check(
  "every widget resolves",
  types.every((t) => getWidget(t) !== undefined),
);
check(
  "every field has a key",
  widgetDefinitions.every((w) => w.fields.every((g) => g.fields.every((f) => Boolean(f.key)))),
);
check(
  "defaults only use JSON values",
  widgetDefinitions.every((w) => {
    try {
      JSON.parse(JSON.stringify(w.defaultProps));
      return true;
    } catch {
      return false;
    }
  }),
);
check(
  "createWidgetElement deep-copies defaults",
  (() => {
    const a = createWidgetElement("cards", createElementId("cards"));
    const b = createWidgetElement("cards", createElementId("cards"));
    (a.props["items"] as unknown[]).push({});
    return (a.props["items"] as unknown[]).length !== (b.props["items"] as unknown[]).length;
  })(),
);

console.log("\n6b. global regions");
for (const region of ["header", "footer"] as const) {
  const doc = defaultRegionDocument(region);
  const parsed = builderDocumentSchema.safeParse(doc);
  check(
    `${region} default validates`,
    parsed.success,
    parsed.success ? "" : JSON.stringify(parsed.error.issues[0]),
  );
  check(`${region} has content`, doc.root.length > 0);
  check(`${region} opens via toBuilderDocument`, toBuilderDocument(null, region).root.length > 0);
  check(`${region} is recognised as a region`, isRegionId(region));
}
check("a page id is not a region", !isRegionId("home"));
// Every id the builder offers must resolve to an openable document.
for (const id of [
  "header",
  "footer",
  "home",
  "about",
  "solutions",
  "shop",
  "contact",
  "work",
  "category",
  "product",
  "privacy",
  "terms",
  "cookies",
] as const) {
  check(`${id} opens in the builder`, toBuilderDocument(null, id).version === 2);
}

console.log("\n7. every widget has a renderer");
import { readFileSync } from "node:fs";
const rendererSource = readFileSync("src/components/builder/BuilderRenderer.tsx", "utf8");
const layoutHandled = new Set(["section", "container", "grid"]);
for (const widget of widgetDefinitions) {
  if (layoutHandled.has(widget.type)) continue;
  check(`${widget.type} is rendered`, rendererSource.includes(`case "${widget.type}":`));
}

console.log("\n8. site settings cache invalidation (real implementation)");
// Exercises the real storefront function, not a stub. It must mark the cached
// settings stale (so the next read refetches fresh branding) while keeping the
// entry, and must not touch unrelated queries.
await (async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(["site-settings"], { branding: { logo_url: "https://old/logo.svg" } });
  queryClient.setQueryData(["products"], [{ id: "p1" }]);
  await resetSiteSettingsCache(queryClient).catch(() => {});
  const settings = queryClient.getQueryState(["site-settings"]);
  check("site settings are invalidated", settings?.isInvalidated === true);
  check(
    "unrelated queries are left alone",
    queryClient.getQueryState(["products"])?.isInvalidated === false,
  );
})();

console.log(failures ? `\n${failures} FAILURE(S)\n` : "\nAll builder checks passed\n");
process.exit(failures ? 1 : 0);
