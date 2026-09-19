import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useProducts, usePublishedPage } from "@/lib/storefront";
import { formatKES, getCategoryConfig } from "@/lib/catalog-data";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryDetail,
  head: ({ params }) => {
    const title = getCategoryConfig(params.slug).name;
    return {
      meta: [
        { title: `${title} — Triad Studio` },
        { name: "description", content: `Browse our ${title.toLowerCase()} solutions.` },
      ],
    };
  },
});

function CategoryDetail() {
  const { slug } = Route.useParams();
  const { data: products } = useProducts();
  const { data: pageDocument } = usePublishedPage("category");
  const intro = pageDocument?.blocks.find((block) => block.id === "category_intro");
  const productsBlock = pageDocument?.blocks.find((block) => block.id === "category_products");

  const category = getCategoryConfig(slug);
  const acceptedCategories = category.aliases;
  const filtered =
    products?.filter((p) => acceptedCategories.includes(p.category.trim().toLowerCase())) || [];
  const categoryName = category.name;
  const description = category.description;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 md:px-12">
        <Link
          to="/solutions"
          className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>
      </div>

      {/* Hero */}
      <div
        className="mx-auto max-w-[1400px] px-6 py-16 md:px-12 md:py-24"
        data-cms-block="category_intro"
      >
        <p className="label-mono text-accent">{intro?.content["eyebrow"] ?? "Category"}</p>
        <h1 className="display mt-4 text-4xl md:text-5xl" data-cms-field="heading">
          {intro?.content["heading"] || categoryName}
        </h1>
        <p
          className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          data-cms-field="body"
        >
          {intro?.content["body"] || description}
        </p>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-12" data-cms-block="category_products">
        {productsBlock?.visible === false ? null : filtered.length > 0 ? (
          <div className="grid gap-6 pb-20 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to="/product/$id"
                params={{ id: p.id }}
                className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-30px_oklch(0.209_0.079_271.5/40%)]"
              >
                <div className="relative overflow-hidden bg-muted">
                  {p.badges?.[0] && (
                    <span className="label-mono absolute left-4 top-4 z-10 rounded-full bg-accent px-3 py-1.5 text-xs text-accent-foreground">
                      {p.badges[0]}
                    </span>
                  )}
                  {p.images?.[0] || p.image_url ? (
                    <img
                      src={p.images?.[0] || p.image_url || undefined}
                      alt={p.title}
                      width={1024}
                      height={768}
                      className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
                      Image coming soon
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <span className="label-mono text-xs text-accent">{p.category}</span>
                  <h3 className="mt-3 text-lg font-medium tracking-tight group-hover:text-accent">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.subtitle}</p>
                  <div className="mt-auto flex items-center justify-between pt-6">
                    <p className="text-lg font-medium">
                      <span className="label-mono mr-2 text-muted-foreground">From</span>
                      {formatKES(p.price_from)}
                    </p>
                    <span className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors group-hover:text-accent">
                      Configure
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground">No products found in this category.</p>
            <Link
              to="/shop"
              className="label-mono mt-4 inline-flex items-center gap-2 text-accent hover:underline"
            >
              <ArrowUpRight className="h-4 w-4" />
              Explore all products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
