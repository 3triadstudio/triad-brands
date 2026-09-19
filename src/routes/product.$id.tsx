import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, ChevronUp, ChevronDown, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { logClick, useProducts, useSiteSettings, usePublishedPage, waLink } from "@/lib/storefront";
import { addToCart } from "@/lib/cart";
import { formatKES } from "@/lib/catalog-data";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const Route = createFileRoute("/product/$id")({
  component: ProductConfigurator,
});

function ProductConfigurator() {
  const { id } = Route.useParams();
  const { data: products } = useProducts();
  const { data: settings } = useSiteSettings();
  const { data: pageDocument } = usePublishedPage("product");
  const product = products?.find((p) => p.id === id);
  const productBlock = pageDocument?.blocks.find((block) => block.id === "product_detail");

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const images = product?.images?.length
    ? product.images
    : product?.image_url
      ? [product.image_url]
      : [];

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedColor, setSelectedColor] = useState("black");
  const [notes, setNotes] = useState("");
  const maxQuantity =
    product?.stock_quantity && product.stock_quantity > 0 ? product.stock_quantity : 999;

  // Update current index when carousel changes
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const handleSelect = () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", handleSelect);
    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi]);

  if (!product || productBlock?.visible === false) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-20">
        <p className="text-muted-foreground">Product not found</p>
        <Link
          to="/shop"
          className="label-mono mt-4 inline-flex items-center gap-2 text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>
      </div>
    );
  }

  const sizes = ["small", "medium", "large", "xl"];
  const colors = ["black", "white", "navy", "red", "blue", "green"];

  const handleOrderViaWhatsApp = () => {
    const message = [
      product.whatsapp_payload || "Hello Triad Studio, I'd like to order a product.",
      `Product: ${product.title}`,
      `Quantity: ${quantity}`,
      `Size: ${selectedSize}`,
      `Color: ${selectedColor}`,
      `Special requests: ${notes || "None"}`,
      `Price estimate: From ${formatKES(product.price_from * quantity)}`,
    ].join("\n");

    void logClick({
      kind: "whatsapp",
      label: product.title,
      category: product.category,
      product_id: product.id,
    });
    window.location.assign(waLink(settings?.contacts.whatsapp ?? "254700390157", message));
  };

  const handleAddToQuote = () => {
    addToCart({
      id: product.id,
      title: product.title,
      from: product.price_from,
      quantity,
      size: selectedSize,
      color: selectedColor,
      notes,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 md:px-12">
        <Link
          to="/shop"
          className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      {/* Main Content */}
      <div
        className="mx-auto max-w-4xl px-6 py-12 md:px-12 md:py-20"
        data-cms-block="product_detail"
      >
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Image Carousel */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
              <Carousel setApi={setCarouselApi} className="w-full">
                <CarouselContent className="w-full">
                  {images.map((img, idx) => (
                    <CarouselItem key={idx} className="w-full">
                      <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
                        <img
                          src={img}
                          alt={`${product.title} - Image ${idx + 1}`}
                          className="h-96 w-full object-cover md:h-full md:min-h-[500px]"
                        />
                        {/* Image counter */}
                        <div className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur">
                          <span>{idx + 1}</span>
                          <span className="text-muted-foreground">/ {images.length}</span>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 hover:bg-background" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 hover:bg-background" />
              </Carousel>
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    carouselApi?.scrollTo(idx);
                    setCurrentImageIndex(idx);
                  }}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    currentImageIndex === idx
                      ? "border-accent shadow-md"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="flex flex-col">
            {/* Product Info */}
            <div className="mb-8">
              <span className="label-mono text-sm text-accent">{product.category}</span>
              <h1 className="display mt-2 text-3xl md:text-4xl">{product.title}</h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {product.subtitle || "High-quality customizable product for your brand."}
              </p>
              <div className="mt-6">
                <p className="label-mono text-muted-foreground">Starting from</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatKES(product.price_from)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.stock_quantity > 0
                    ? `${product.stock_quantity} available`
                    : "Made to order"}
                </p>
              </div>
            </div>

            {/* Configurator */}
            <div className="space-y-6 rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
              {/* Quantity */}
              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">
                  Quantity
                </label>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                    disabled={quantity === 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    max={maxQuantity}
                    onChange={(e) =>
                      setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))
                    }
                    className="h-10 w-16 rounded-lg border border-border bg-background text-center text-sm font-medium outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">
                  Size
                </label>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background hover:border-accent/50"
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">
                  Color
                </label>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                        selectedColor === color
                          ? "border-accent"
                          : "border-transparent hover:border-border"
                      }`}
                      style={{
                        backgroundColor:
                          color === "black"
                            ? "#000"
                            : color === "white"
                              ? "#fff"
                              : color === "navy"
                                ? "#001f3f"
                                : color === "red"
                                  ? "#e63946"
                                  : color === "blue"
                                    ? "#0066ff"
                                    : "#2ecc71",
                        color: ["white", "blue"].includes(color) ? "#000" : "#fff",
                      }}
                    >
                      {color.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">
                  Special requests (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Custom imprints, specific requirements, etc."
                  className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  rows={3}
                />
              </div>

              <button
                type="button"
                onClick={handleAddToQuote}
                className="group mt-2 w-full rounded-lg border border-border bg-background py-4 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Add configured item to quote shortlist
              </button>

              {/* Order Button */}
              <button
                type="button"
                onClick={handleOrderViaWhatsApp}
                className="group mt-2 w-full rounded-full bg-accent py-4 text-sm font-semibold text-accent-foreground transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
              >
                <span className="inline-flex items-center gap-2">
                  Send Order via WhatsApp
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>

            {/* Badges */}
            <div className="mt-8 space-y-2 border-t border-border pt-6">
              {product.badges?.map((badge) => (
                <p key={badge} className="label-mono text-xs text-muted-foreground">
                  ✓ {badge}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
