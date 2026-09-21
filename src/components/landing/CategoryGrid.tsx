import type { CSSProperties } from "react";
import { ArrowUpRight, Coffee, Flag, Gift, Shirt } from "lucide-react";
import type { PageBlockItem } from "@/lib/page-editor";
import { catalogCategories, categorySlugFromHref } from "@/lib/catalog-data";
import { useProducts } from "@/lib/storefront";

const icons = { shirt: Shirt, mug: Coffee, flag: Flag, gift: Gift } as const;

export function CategoryGrid({
  content = {},
  items,
  design,
}: {
  content?: Record<string, string>;
  items?: PageBlockItem[];
  design?: CSSProperties;
}) {
  const { data: products } = useProducts();
  const liveCategories = Array.from(
    new Map(
      (products ?? []).map((product) => [product.category.trim().toLowerCase(), product]),
    ).values(),
  ).map((product) => ({
    id: product.category,
    name: product.category,
    blurb: product.subtitle || product.description,
    icon: "gift" as const,
    slug: categorySlugFromHref(undefined, product.category),
    href: `/category/${categorySlugFromHref(undefined, product.category)}`,
    buttonLabel: "Browse",
    img: product.images[0] ?? catalogCategories[0]!.img,
  }));
  const categories = items?.length
    ? items
        .filter((item) => item.visible !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((item, index) => ({
          ...(liveCategories.find(
            (category) => category.name.trim().toLowerCase() === item.label.trim().toLowerCase(),
          ) ??
            liveCategories[index] ??
            catalogCategories[index % catalogCategories.length]!),
          id: item.id,
          name: item.label,
          blurb: item.description,
          slug: categorySlugFromHref(item.href, item.id),
          href: item.href,
          buttonLabel: item.buttonLabel || "Browse",
          img: item.image ?? catalogCategories[index % catalogCategories.length]!.img,
        }))
    : liveCategories.length
      ? liveCategories
      : catalogCategories.map((category) => ({
        ...category,
        slug: category.id,
        href: `/category/${category.id}`,
        buttonLabel: "Browse",
      }));
  return (
    <section className="px-3 md:px-6" data-cms-block="categories" style={design}>
      <div className="mx-auto max-w-[1400px] rounded-xl bg-muted/60 px-5 py-20 sm:px-6 md:px-14 md:py-28">
        <h2 className="display text-[clamp(2rem,5vw,4rem)]" data-cms-field="categories.heading">
          {content["categories.heading"] ?? "Browse by category"}
          <span className="text-accent">.</span>
        </h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const Icon = icons[c.icon];
            return (
              <a
                key={c.id}
                href={c.href || `/category/${c.slug}`}
                className="group flex min-h-[25rem] flex-col overflow-hidden rounded-xl bg-background shadow-[0_10px_30px_-24px_oklch(0.209_0.079_271.5/45%)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_-24px_oklch(0.209_0.079_271.5/45%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <div className="flex flex-1 flex-col p-7">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-8 text-lg font-medium tracking-tight">{c.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
                  <span className="label-mono mt-6 inline-flex items-center gap-2 text-muted-foreground transition-colors group-hover:text-accent">
                    {c.buttonLabel}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
                <img
                  src={c.img}
                  alt={c.name}
                  loading="lazy"
                  width={640}
                  height={360}
                  className="aspect-[16/9] h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
