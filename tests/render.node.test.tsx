import { renderToStaticMarkup } from "react-dom/server";

import { RenderElement, BuilderCanvasContent } from "@/components/builder/BuilderRenderer";
import { createWidgetElement, widgetDefinitions } from "@/lib/builder/registry";
import { defaultRegionDocument } from "@/lib/builder/regions";
import { createElementId, type BuilderElement } from "@/lib/builder/types";

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (ok) console.log(`  ok   ${name}`);
  else {
    failures += 1;
    console.log(`  FAIL ${name} ${extra}`);
  }
};

console.log("\n1. every widget renders from its defaults");
for (const widget of widgetDefinitions) {
  const element = createWidgetElement(widget.type, createElementId(widget.type));
  try {
    const html = renderToStaticMarkup(<RenderElement element={element} />);
    check(`${widget.type} renders`, html.includes(`data-builder-id="${element.id}"`));
  } catch (error) {
    check(`${widget.type} renders`, false, String((error as Error).message).slice(0, 120));
  }
}

console.log("\n2. widgets survive empty and malformed props");
for (const widget of widgetDefinitions) {
  const bare: BuilderElement = {
    id: createElementId(widget.type),
    type: widget.type,
    props: {},
    style: {},
    visibility: {},
    children: [],
  };
  try {
    renderToStaticMarkup(<RenderElement element={bare} />);
    check(`${widget.type} with no props`, true);
  } catch (error) {
    check(`${widget.type} with no props`, false, String((error as Error).message).slice(0, 120));
  }
}

console.log("\n3. nested layout renders its children");
const nested: BuilderElement = {
  ...createWidgetElement("section", "sec"),
  children: [
    {
      ...createWidgetElement("grid", "grid"),
      children: [
        { ...createWidgetElement("heading", "h"), props: { text: "Nested heading", level: "h2" } },
        { ...createWidgetElement("text", "t"), props: { text: "Nested body" } },
      ],
    },
  ],
};
const nestedHtml = renderToStaticMarkup(<RenderElement element={nested} />);
check("renders nested heading", nestedHtml.includes("Nested heading"));
check("renders nested body", nestedHtml.includes("Nested body"));
check("grid gets its column template", nestedHtml.includes("grid-template-columns"));

console.log("\n4. responsive style reaches the output");
const styled: BuilderElement = {
  ...createWidgetElement("text", "styled"),
  props: { text: "Styled" },
  style: { base: { fontSize: "22px" }, mobile: { fontSize: "13px" } },
};
const styledHtml = renderToStaticMarkup(<BuilderCanvasContent root={[styled]} />);
check("emits the base declaration", styledHtml.includes("font-size: 22px"));
check("emits the mobile media query", styledHtml.includes("max-width: 640px"));

console.log("\n5. global regions render");
for (const region of ["header", "footer"] as const) {
  const document = defaultRegionDocument(region);
  try {
    const html = renderToStaticMarkup(<BuilderCanvasContent root={document.root} />);
    check(`${region} renders`, html.length > 200, `${html.length} chars`);
  } catch (error) {
    check(`${region} renders`, false, String((error as Error).message).slice(0, 160));
  }
}

console.log(failures ? `\n${failures} FAILURE(S)\n` : "\nAll render checks passed\n");
process.exit(failures ? 1 : 0);
