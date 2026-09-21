import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StartProjectDialog } from "@/components/StartProjectDialog";
import { formatKES } from "@/lib/catalog-data";
import { useProducts, useProjects, useServices } from "@/lib/storefront";
import type { PageBlock, PageDocument } from "@/lib/page-editor";
import { CategoryGrid } from "@/components/landing/CategoryGrid";
import { FeaturedSolutions } from "@/components/landing/FeaturedSolutions";
import { HeroCarousel } from "@/components/landing/HeroCarousel";
import { PromoBanner } from "@/components/landing/PromoBanner";
import { ValuePropsRow } from "@/components/landing/ValuePropsRow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function baseDesign(design: PageBlock["design"]) {
  return Object.fromEntries(Object.entries(design).filter(([key]) => !key.includes(".")));
}

function ResponsiveBlockStyles({ block }: { block: PageBlock }) {
  const rules = (breakpoint: "tablet" | "mobile") =>
    Object.entries(block.design)
      .filter(([key]) => key.startsWith(`${breakpoint}.`))
      .map(
        ([key, value]) =>
          `${key.slice(breakpoint.length + 1).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`,
      )
      .join(";");
  const tablet = rules("tablet");
  const mobile = rules("mobile");
  if (!tablet && !mobile) return null;
  const selector = `[data-cms-block="${block.id.replace(/[^a-zA-Z0-9_-]/g, "")}"]`;
  return (
    <style>{`${tablet ? `@media (max-width: 1024px){${selector}{${tablet}}}` : ""}${mobile ? `@media (max-width: 640px){${selector}{${mobile}}}` : ""}`}</style>
  );
}

function NestedLayout({ block }: { block: PageBlock }) {
  const children = block.children ?? [];
  return (
    <section
      data-cms-block={block.id}
      style={baseDesign(block.design)}
      className={
        block.kind === "columns"
          ? "mx-auto grid max-w-[1400px] gap-6 px-6 md:grid-cols-2 md:px-12"
          : "mx-auto max-w-[1400px] px-6 md:px-12"
      }
    >
      {children.map((child) => (
        <div key={child.id}>
          <PublishedBlock block={child} />
        </div>
      ))}
    </section>
  );
}

function PublishedBlock({ block }: { block: PageBlock }) {
  if (block.kind === "container" || block.kind === "columns") return <NestedLayout block={block} />;
  if (block.kind === "rich_text") return <RichText block={block} />;
  if (block.kind === "featured") return <Products block={block} />;
  if (block.kind === "services") return <Services block={block} />;
  if (block.kind === "projects") return <Projects block={block} />;
  if (block.kind === "contact_form") return <ContactCta block={block} />;
  return null;
}

function RichText({ block }: { block: PageBlock }) {
  const content = block.content as Record<string, string | undefined>;
  const eyebrow = content["eyebrow"] ?? "";
  const heading = content["heading"] ?? "";
  const body = content["body"] ?? "";
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 pb-16 pt-16 md:px-12 md:pb-20 md:pt-24"
      data-cms-block={block.id}
      style={baseDesign(block.design)}
    >
      {eyebrow ? (
        <p className="label-mono text-accent" data-cms-field="eyebrow">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="display mt-6 max-w-5xl text-[clamp(2.4rem,7vw,6rem)]" data-cms-field="heading">
        {heading}
      </h1>
      {body ? (
        <p
          className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          data-cms-field="body"
        >
          {body}
        </p>
      ) : null}
    </section>
  );
}

function Products({ block }: { block: PageBlock }) {
  const { data, isError } = useProducts();
  const products = data ?? [];
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32"
      data-cms-block={block.id}
      style={baseDesign(block.design)}
    >
      <h2 className="display mb-10 text-[clamp(2rem,5vw,4rem)]" data-cms-field="heading">
        {block.content["heading"] ?? "Browse the catalog"}
        <span className="text-accent">.</span>
      </h2>
      {isError ? (
        <p className="text-sm text-muted-foreground">
          The catalog could not be loaded. Please try again.
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            to="/product/$id"
            params={{ id: product.id }}
            className="group overflow-hidden rounded-[var(--radius)] border border-border bg-card"
          >
            <div className="bg-muted">
              {(product.images?.[0] ?? product.image_url) ? (
                <img
                  src={product.images?.[0] ?? product.image_url ?? undefined}
                  alt={product.title}
                  className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="h-72" />
              )}
            </div>
            <div className="p-6">
              <p className="label-mono text-accent">{product.category}</p>
              <h3 className="mt-3 text-xl font-medium">{product.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {product.subtitle || product.description}
              </p>
              <p className="mt-6 font-semibold">From {formatKES(product.price_from)}</p>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelectedProduct(product);
                }}
                className="label-mono mt-5 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-accent"
              >
                Quick view <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Link>
        ))}
      </div>
      {selectedProduct ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelectedProduct(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProduct.title}</DialogTitle>
              <DialogDescription>
                {selectedProduct.subtitle || selectedProduct.description}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Product details: from {formatKES(selectedProduct.price_from)}. Request a quote for
              quantities, availability, and delivery.
            </p>
            <StartProjectDialog className="inline-flex w-fit rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
              Request a quote
            </StartProjectDialog>
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  );
}

function Services({ block }: { block: PageBlock }) {
  const { data, isError } = useServices();
  const categoryHref = (index: number) =>
    (["/category/apparel", "/category/drinkware", "/category/event", "/category/promo"] as const)[
      index % 4
    ];
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32"
      data-cms-block={block.id}
      style={block.design}
    >
      {isError ? (
        <p className="text-sm text-muted-foreground">
          Services could not be loaded. Please try again.
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((service, index) => {
          const href = service.categoryHref ?? categoryHref(index);
          return (
            <Link
              key={service.id}
              to={href as "/category/$slug"}
              params={{ slug: href.split("/").pop() ?? "promo" }}
              className={`soft-card p-8 md:p-10 ${index % 5 === 1 ? "bg-primary text-primary-foreground" : ""}`}
            >
              <span className="pill">{service.tag}</span>
              <h2 className="display mt-10 text-2xl md:text-3xl">{service.name}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">{service.detail}</p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {service.deliverables.map((item) => (
                  <li
                    key={item}
                    className="label-mono rounded-full border border-border px-3 py-1.5"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Projects({ block }: { block: PageBlock }) {
  const { data, isError } = useProjects();
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32"
      data-cms-block={block.id}
      style={block.design}
    >
      {block.content["heading"] ? (
        <h2 className="display mb-10 text-[clamp(2rem,5vw,4rem)]">
          {block.content["heading"]}
          <span className="text-accent">.</span>
        </h2>
      ) : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">
          Projects could not be loaded. Please try again.
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        {(data ?? []).map((project) => (
          <Link key={project.id} to="/work/$slug" params={{ slug: project.slug }} className="group">
            <div className="overflow-hidden rounded-[var(--radius)] bg-muted">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="h-72" />
              )}
            </div>
            <h3 className="mt-5 text-xl font-medium">{project.title}</h3>
            <p className="label-mono mt-2 text-muted-foreground">
              {project.meta || project.category}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Founders({ block }: { block: PageBlock }) {
  const founders = [1, 2, 3].map((index) => ({
    name: block.content[`founder_${index}_name`] ?? `Founder ${index}`,
    role: block.content[`founder_${index}_role`] ?? "Triad Brands",
    bio: block.content[`founder_${index}_bio`] ?? "",
  }));
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32"
      data-cms-block={block.id}
      style={baseDesign(block.design)}
    >
      <p className="label-mono text-accent" data-cms-field="eyebrow">
        {block.content["eyebrow"] ?? "The founders"}
      </p>
      <h2 className="display mt-5 max-w-3xl text-[clamp(2rem,5vw,4rem)]" data-cms-field="heading">
        {block.content["heading"] ?? "Three points of view. One standard."}
      </h2>
      <p
        className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        data-cms-field="body"
      >
        {block.content["body"]}
      </p>
      <div className="mt-12 grid gap-3 md:grid-cols-3">
        {founders.map((founder, index) => (
          <article key={founder.name} className="soft-card p-8 md:p-10">
            <span className="label-mono text-accent">0{index + 1}</span>
            <h3 className="display mt-10 text-2xl md:text-3xl">{founder.name}</h3>
            <p className="label-mono mt-3 text-muted-foreground">{founder.role}</p>
            <p className="mt-6 leading-relaxed text-muted-foreground">{founder.bio}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactCta({ block }: { block: PageBlock }) {
  return (
    <section className="px-3 pb-24 md:px-6 md:pb-32" data-cms-block={block.id} style={block.design}>
      <div className="mx-auto max-w-[1400px] rounded-[var(--radius)] bg-primary px-6 py-20 text-primary-foreground md:px-14 md:py-28">
        <h2 className="display max-w-3xl text-[clamp(2rem,5vw,4rem)]" data-cms-field="heading">
          {block.content["heading"] ?? "Let’s make it work together."}
          <span className="text-accent">.</span>
        </h2>
        <StartProjectDialog className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-medium text-accent-foreground">
          <>
            Start a project <ArrowUpRight className="h-4 w-4" />
          </>
        </StartProjectDialog>
      </div>
    </section>
  );
}

export function PublishedPage({ document }: { document: PageDocument }) {
  useEffect(() => {
    const setMeta = (attribute: "name" | "property", key: string, value: string) => {
      if (!value) return;
      let meta = window.document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!meta) {
        meta = window.document.createElement("meta");
        meta.setAttribute(attribute, key);
        window.document.head.appendChild(meta);
      }
      meta.content = value;
    };

    if (document.seo.title) window.document.title = document.seo.title;
    setMeta("name", "description", document.seo.description);
    const metaValues: Array<["name" | "property", string, string | undefined]> = [
      ["property", "og:title", document.seo.ogTitle || document.seo.title],
      ["property", "og:description", document.seo.ogDescription || document.seo.description],
      ["property", "og:image", document.seo.ogImage],
      ["name", "twitter:card", document.seo.twitterCard],
      ["name", "twitter:title", document.seo.ogTitle || document.seo.title],
      ["name", "twitter:description", document.seo.ogDescription || document.seo.description],
      ["name", "twitter:image", document.seo.ogImage],
    ];
    for (const [attribute, key, value] of metaValues) {
      if (value) setMeta(attribute, key, value);
    }
    if (document.seo.canonical) {
      const canonical = window.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (canonical) canonical.href = document.seo.canonical;
      else {
        const link = window.document.createElement("link");
        link.rel = "canonical";
        link.href = document.seo.canonical;
        window.document.head.appendChild(link);
      }
    }
  }, [document.seo]);

  return (
    <>
      {document.blocks
        .filter((block) => block.visible)
        .map((block) => {
          const rendered = (() => {
            switch (block.kind) {
              case "container":
              case "columns":
                return <NestedLayout key={block.id} block={block} />;
              case "hero":
                return (
                  <HeroCarousel
                    key={block.id}
                    content={block.content}
                    design={baseDesign(block.design)}
                    items={block.items}
                  />
                );
              case "featured":
                return block.id === "shop_products" || block.id === "category_products" ? (
                  <Products key={block.id} block={block} />
                ) : (
                  <FeaturedSolutions
                    key={block.id}
                    content={block.content}
                    design={baseDesign(block.design)}
                  />
                );
              case "categories":
                return (
                  <CategoryGrid
                    key={block.id}
                    content={block.content}
                    items={block.items}
                    design={baseDesign(block.design)}
                  />
                );
              case "promo":
                return (
                  <PromoBanner
                    key={block.id}
                    content={block.content}
                    design={baseDesign(block.design)}
                  />
                );
              case "value_props":
                return <ValuePropsRow key={block.id} design={baseDesign(block.design)} />;
              case "rich_text":
                return <RichText key={block.id} block={block} />;
              case "services":
                return <Services key={block.id} block={block} />;
              case "projects":
                return <Projects key={block.id} block={block} />;
              case "founders":
                return <Founders key={block.id} block={block} />;
              case "contact_form":
                return <ContactCta key={block.id} block={block} />;
              default:
                return null;
            }
          })();
          return rendered ? (
            <div key={`frame-${block.id}`} className="contents">
              {rendered}
              <ResponsiveBlockStyles block={block} />
            </div>
          ) : null;
        })}
    </>
  );
}
