import { createFileRoute } from "@tanstack/react-router";
import { usePublishedPage, useSections } from "@/lib/storefront";
import { HeroCarousel } from "@/components/landing/HeroCarousel";
import { FeaturedSolutions } from "@/components/landing/FeaturedSolutions";
import { CategoryGrid } from "@/components/landing/CategoryGrid";
import { PromoBanner } from "@/components/landing/PromoBanner";
import { ValuePropsRow } from "@/components/landing/ValuePropsRow";
import { PublishedPage } from "@/components/PublishedPage";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Triad Brands | Branding, Digital, Print & Merchandise in Nairobi" },
      {
        name: "description",
        content:
          "Custom branding, digital design, print production and branded merchandise for businesses in Nairobi, Kenya.",
      },
      { property: "og:title", content: "Triad Brands | Branding, Digital, Print & Merchandise in Nairobi" },
      {
        property: "og:description",
        content:
          "Bring your next campaign, product launch, or internal refresh to a team that handles strategy, design and production in one place.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.triadbrands.co.ke/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.triadbrands.co.ke/" }],
  }),
});

function Index() {
  const { data: sections } = useSections();
  const { data: document } = usePublishedPage("home");
  const fallbackOrder = ["hero", "featured", "categories", "promo", "value_props"];
  const documentBlocks = document?.blocks ?? [];
  const order = documentBlocks.map((block) => block.id) ?? fallbackOrder;
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
          key,
          content: contentFor(key),
          design: designFor(key),
          ...(categoryItems ? { items: categoryItems } : {}),
        };
        return <CategoryGrid {...props} />;
      }
      case "promo":
        return <PromoBanner key={key} content={contentFor(key)} design={designFor(key)} />;
      case "value_props": {
        const valuePropsBlock = documentBlocks.find((block) => block.id === key);
        const valuePropsItems = valuePropsBlock?.items;
        const props = {
          key,
          content: contentFor(key),
          design: designFor(key),
          ...(valuePropsItems ? { items: valuePropsItems } : {}),
        };
        return <ValuePropsRow {...props} />;
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
