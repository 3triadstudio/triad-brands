import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShoppingCart, Star } from "lucide-react";
import { featuredProducts, formatKES } from "@/lib/catalog-data";
import { useProducts } from "@/lib/storefront";

export function FeaturedSolutions({
  content = {},
  design = {},
}: {
  content?: Record<string, string>;
  design?: CSSProperties;
}) {
  const { data: remoteProducts } = useProducts();
  const products = remoteProducts?.length
    ? remoteProducts
        .filter((product) => product.featured)
        .map((product) => ({
          id: product.id,
          badge: product.badges[0] ?? "Featured",
          category: product.category,
          title: product.title,
          rating: 5,
          reviews: 0,
          from: product.price_from,
          img: product.images?.[0] ?? product.image_url ?? featuredProducts[0]!.img,
        }))
    : featuredProducts;

  return (
    <section
      className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 md:px-12 md:py-28"
      data-cms-block="featured"
      style={design}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-6">
        <h2 className="display text-[clamp(2rem,5vw,4rem)]" data-cms-field="featured.heading">
          {content["featured.heading"] ?? "Featured solutions"}
          <span className="text-amber">.</span>
        </h2>
        <Link
          to="/shop"
          className="label-mono group inline-flex items-center gap-2 border-b border-border pb-1 transition-colors hover:border-accent"
        >
          View Full Catalog
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="mt-12 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.id}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_24px_60px_-30px_oklch(0.209_0.079_271.5/40%)]"
          >
            <div className="relative overflow-hidden bg-muted">
              <span className="label-mono absolute left-4 top-4 z-10 rounded-full bg-accent px-3 py-1.5 text-accent-foreground">
                {p.badge}
              </span>
              <img
                src={p.img}
                alt={p.title}
                width={1024}
                height={1024}
                loading="lazy"
                className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </div>

            <div className="flex flex-1 flex-col p-6">
              <span className="label-mono text-accent">{p.category}</span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-balance">{p.title}</h3>
              <div className="mt-3 flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={
                        s < Math.round(p.rating)
                          ? "h-3.5 w-3.5 fill-amber text-amber"
                          : "h-3.5 w-3.5 text-muted-foreground"
                      }
                    />
                  ))}
                </span>
                <span className="label-mono text-muted-foreground">
                  {p.rating} ({p.reviews})
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-6">
                <div>
                  <p className="label-mono text-xs text-muted-foreground">From</p>
                  <p className="text-lg font-medium text-foreground">{formatKES(p.from)}</p>
                </div>
                <Link
                  to="/product/$id"
                  params={{ id: String(p.id) }}
                  className="group/btn inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Add to Cart
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
