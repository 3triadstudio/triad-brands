import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  ShoppingBag,
  Send,
} from "lucide-react";
import { addToCart, useCart } from "@/lib/cart";
import { formatKES } from "@/lib/catalog-data";
import { useProducts, useSiteSettings, usePublishedPage } from "@/lib/storefront";
import { PublishedPage } from "@/components/PublishedPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/shop/")({
  component: ShopIndex,
  head: () => ({
    meta: [
      { title: "Shop — Branded merchandise | Triad Studio" },
      {
        name: "description",
        content:
          "Browse Triad Studio's managed catalog of branded apparel, drinkware, event equipment, and promotional merchandise.",
      },
      { property: "og:title", content: "Shop — Triad Studio" },
      {
        property: "og:description",
        content: "Branded merchandise produced and delivered by Triad Studio.",
      },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
});

function ShopIndex() {
  const { data: pageDocument } = usePublishedPage("shop");
  const { data: products, isPending, isError, refetch } = useProducts();
  const { data: settings } = useSiteSettings();
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<(typeof visible)[number] | null>(null);
  const [orderingProduct, setOrderingProduct] = useState<(typeof visible)[number] | null>(null);
  const cartItems = useCart();

  const categories = useMemo(
    () => ["All", ...new Set((products ?? []).map((product) => product.category).filter(Boolean))],
    [products],
  );
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (products ?? []).filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const searchable = `${product.title} ${product.subtitle} ${product.category}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeCategory, products, query]);

  if (pageDocument) return <PublishedPage document={pageDocument} />;

  return (
    <>
      <section className="mx-auto max-w-[1400px] px-6 pb-14 pt-16 md:px-12 md:pb-20 md:pt-24">
        <p className="label-mono text-accent">Shop the catalog</p>
        <div className="mt-6 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <h1 className="display max-w-4xl text-[clamp(2.8rem,7vw,6rem)]">
              Branded goods,
              <br />
              made to move<span className="text-amber">.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Browse live availability, choose what fits your brief, and add items to your cart.
              Every product shown here is managed from the Triad Studio catalog.
            </p>
          </div>
          <div className="label-mono flex shrink-0 items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live catalog
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32">
        <div className="mb-10 flex flex-col gap-4 border-y border-border py-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="label-mono text-muted-foreground">
            {isPending
              ? "Loading catalog…"
              : `${visible.length} ${visible.length === 1 ? "item" : "items"}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="flex min-w-[min(100%,18rem)] items-center gap-2 rounded-full border border-border px-4 py-2 text-muted-foreground focus-within:border-foreground">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`label-mono rounded-full border px-4 py-2 transition-colors ${
                  activeCategory === category
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="rounded-[var(--radius)] border border-border bg-muted/40 px-6 py-12 text-center">
            <p className="text-muted-foreground">We couldn’t load the catalog right now.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="label-mono mt-4 text-accent underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : visible.length ? (
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((product) => {
              const image = product.images?.[0] || product.image_url;
              const isAdded = cartItems.some((item) => item.id === product.id);
              const hasSale =
                product.sale_price !== null && product.sale_price < product.price_from;
              return (
                <article key={product.id} className="group flex flex-col">
                  <Link to="/product/$id" params={{ id: product.id }} className="block">
                    <div className="relative overflow-hidden rounded-[var(--radius)] bg-muted">
                      {product.badges?.[0] ? (
                        <span className="label-mono absolute left-4 top-4 z-10 rounded-full bg-accent px-3 py-1.5 text-xs text-accent-foreground">
                          {product.badges[0]}
                        </span>
                      ) : null}
                      {image ? (
                        <img
                          src={image}
                          alt={product.title}
                          loading="lazy"
                          className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-80 items-center justify-center text-muted-foreground">
                          No image available
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="mt-5 flex flex-1 flex-col">
                    <p className="label-mono text-accent">{product.category}</p>
                    <Link to="/product/$id" params={{ id: product.id }}>
                      <h2 className="mt-3 text-xl font-medium leading-snug tracking-tight transition-colors group-hover:text-accent">
                        {product.title}
                      </h2>
                    </Link>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {product.subtitle || product.description}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                      <div>
                        <p className="label-mono text-muted-foreground">From</p>
                        <p className="mt-1 text-lg font-semibold">
                          {formatKES(hasSale ? product.sale_price! : product.price_from)}
                          {hasSale ? (
                            <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                              {formatKES(product.price_from)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOrderingProduct(product)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          isAdded
                            ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700"
                            : "border-border hover:border-accent hover:text-accent"
                        }`}
                      >
                        {isAdded ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <ShoppingBag className="h-3.5 w-3.5" />
                        )}
                        {isAdded ? "Add another" : "Add to cart"}
                      </button>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-accent"
                      >
                        Quick view <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        to="/product/$id"
                        params={{ id: product.id }}
                        className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-accent"
                      >
                        View details <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            No products match your search. Try a different category or keyword.
          </p>
        )}
      </section>
      {selectedProduct ? (
        <ProductQuickViewDialog
          product={selectedProduct}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedProduct(null);
          }}
        />
      ) : null}
      {orderingProduct ? (
        <ProductOrderDialog
          {...(settings?.contacts?.whatsapp ? { whatsappNumber: settings.contacts.whatsapp } : {})}
          product={orderingProduct}
          open
          onOpenChange={(open) => {
            if (!open) setOrderingProduct(null);
          }}
        />
      ) : null}
    </>
  );
}

type OrderProduct = NonNullable<ReturnType<typeof useProducts>["data"]>[number];

function ProductQuickViewDialog({
  product,
  open,
  onOpenChange,
}: {
  product: OrderProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const image = product.images?.[0] || product.image_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden border-0 bg-background p-0">
        <div className="grid md:grid-cols-2">
          <div className="bg-muted">
            {image ? (
              <img
                src={image}
                alt={product.title}
                className="h-full min-h-[280px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>
          <div className="p-6 md:p-8">
            <DialogHeader className="mb-5 text-left">
              <p className="label-mono text-accent">{product.category}</p>
              <DialogTitle className="mt-2 text-2xl font-semibold">{product.title}</DialogTitle>
              <DialogDescription className="mt-2 text-base leading-relaxed text-muted-foreground">
                {product.subtitle || product.description}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label-mono text-muted-foreground">From</p>
                <p className="mt-2 text-2xl font-semibold">{formatKES(product.price_from)}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {product.stock_quantity > 0
                  ? `${product.stock_quantity} in stock`
                  : "Made to order"}
              </span>
            </div>

            <div className="mt-6 space-y-3 rounded-[var(--radius)] border border-border bg-muted/30 p-4">
              <p className="label-mono text-foreground">Quick details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Quantity
                  </p>
                  <p className="mt-1 text-sm">Flexible order volume</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Size</p>
                  <p className="mt-1 text-sm">Small, medium, large, XL</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  addToCart({ id: product.id, title: product.title, from: product.price_from });
                  onOpenChange(false);
                }}
                className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background"
              >
                Add to cart
              </button>
              <Link
                to="/product/$id"
                params={{ id: product.id }}
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
              >
                View details
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductOrderDialog({
  product,
  whatsappNumber,
  open,
  onOpenChange,
}: {
  product: OrderProduct;
  whatsappNumber?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const maxQuantity = product.stock_quantity > 0 ? product.stock_quantity : 999;
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("medium");
  const [color, setColor] = useState("black");
  const [notes, setNotes] = useState("");

  const submit = () => {
    addToCart({
      id: product.id,
      title: product.title,
      from: product.price_from,
      quantity,
      size,
      color,
      notes,
    });
    const message = [
      "Hello Triad Studio, I'd like to order a product.",
      `Product: ${product.title}`,
      `Quantity: ${quantity}`,
      `Size: ${size}`,
      `Color: ${color}`,
      `Special requests: ${notes || "None"}`,
      `Price estimate: From ${formatKES(product.price_from * quantity)}`,
    ].join("\n");
    const number = (whatsappNumber || "254700390157").replace(/\D/g, "");
    window.location.assign(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {product.title}</DialogTitle>
          <DialogDescription>
            Add your requirements below and we&apos;ll continue the order on WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <label className="label-mono block text-sm font-semibold">Quantity</label>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity === 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.min(
                      maxQuantity,
                      Math.max(1, Number.parseInt(event.target.value, 10) || 1),
                    ),
                  )
                }
                className="h-10 w-20 rounded-lg border border-border bg-background text-center text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                disabled={quantity >= maxQuantity}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="label-mono block text-sm font-semibold">Size</label>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {["small", "medium", "large", "xl"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                    size === option
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-mono block text-sm font-semibold">Color</label>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {["black", "white", "navy", "red", "blue", "green"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={`rounded-lg border px-3 py-2 text-xs capitalize ${
                    color === option
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-mono block text-sm font-semibold">Special requests</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Custom imprint, branding requirements, delivery details..."
              rows={3}
              className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Send order via WhatsApp
            <Send className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
