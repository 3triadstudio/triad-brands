import { createFileRoute } from "@tanstack/react-router";
import { legacyBlocks, usePublishedPage, useSections } from "@/lib/storefront";
import { HeroCarousel } from "@/components/landing/HeroCarousel";
import { FeaturedSolutions } from "@/components/landing/FeaturedSolutions";
import { CategoryGrid } from "@/components/landing/CategoryGrid";
import { PromoBanner } from "@/components/landing/PromoBanner";
import { ValuePropsRow } from "@/components/landing/ValuePropsRow";
import { PublishedPage } from "@/components/PublishedPage";
import { pageCopy, pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => pageSeo(pageCopy.home),
});

function Index() {
  const { data: sections } = useSections();
  const { data: document } = usePublishedPage("home");
  const fallbackOrder = ["hero", "featured", "categories", "promo", "value_props"];
  const documentBlocks = legacyBlocks(document);
  // `[].map()` is still an array, so `??` never reached the fallback: with no
  // published home document the homepage rendered an empty <main> — no hero,
  // no H1 and no indexable copy.
  const order = documentBlocks.length ? documentBlocks.map((block) => block.id) : fallbackOrder;
  const contentFor = (key: string) =>
    documentBlocks.find((block) => block.id === key)?.content ?? {};
  const designFor = (key: string) => documentBlocks.find((block) => block.id === key)?.design ?? {};
  const visible = (key: string) => {
    const documentBlock = documentBlocks.find((block) => block.id === key);
    if (documentBlock) return documentBlock.visible;
    return sections?.find((section) => section.key === key)?.is_visible ?? true;
  };

  if (document) return <PublishedPage document={document} />;

  const renderBlock = (key: string) => {
    if (!visible(key)) return null;
    switch (key) {
      case "hero":
        return <HeroCarousel key={key} content={contentFor(key)} design={designFor(key)} />;
      case "featured":
        return <FeaturedSolutions key={key} content={contentFor(key)} design={designFor(key)} />;
      case "categories": {
        const categoryItems = documentBlocks.find((block) => block.id === key)?.items;
        const props = {
          content: contentFor(key),
          design: designFor(key),
          ...(categoryItems ? { items: categoryItems } : {}),
        };
        return <CategoryGrid key={key} {...props} />;
      }
      case "promo":
        return <PromoBanner key={key} content={contentFor(key)} design={designFor(key)} />;
      case "value_props": {
        const valuePropsBlock = documentBlocks.find((block) => block.id === key);
        const valuePropsItems = valuePropsBlock?.items;
        const props = {
          content: contentFor(key),
          design: designFor(key),
          ...(valuePropsItems ? { items: valuePropsItems } : {}),
        };
        return <ValuePropsRow key={key} {...props} />;
      }
      default:
        return null;
    }
  };

  return (
    <>
      {order.map((key) => {
        const block = documentBlocks.find((candidate) => candidate.id === key);
        if (block && !block.mobileVisible) {
          return (
            <div key={key} data-cms-block={key} className="hidden sm:block">
              {renderBlock(key)}
            </div>
          );
        }
        return renderBlock(key);
      })}
    </>
  );
}
