import { Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { StartProjectDialog } from "@/components/StartProjectDialog";
import { propBoolean, propList, propNumber, propString } from "@/lib/builder/fields";
import { iconRegistry } from "@/lib/builder/icons";
import { documentCss, documentLayoutCss, layoutStyle } from "@/lib/builder/style";
import { emptyLink, type BuilderElement, type LinkValue } from "@/lib/builder/types";
import { categoryCards, formatKES, heroSlides, trustBadges } from "@/lib/catalog-data";
import {
  useHeroSlides,
  useProducts,
  useProjects,
  useServices,
  useSiteSettings,
  useSocialLinks,
} from "@/lib/storefront";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function icon(name: string, className = "h-4 w-4") {
  const Component = iconRegistry[name];
  if (!Component) return null;
  return <Component className={className} aria-hidden="true" />;
}

function readLink(value: unknown): LinkValue {
  if (!value || typeof value !== "object") return emptyLink;
  const raw = value as Partial<LinkValue>;
  return {
    href: typeof raw.href === "string" ? raw.href : "",
    target: raw.target === "_blank" ? "_blank" : "_self",
    rel: typeof raw.rel === "string" ? raw.rel : "",
    action:
      raw.action === "start_project" || raw.action === "scroll_to" || raw.action === "whatsapp"
        ? raw.action
        : "navigate",
  };
}

/**
 * One link component for every widget, so a button, an image and a card all
 * honour the same destination rules — including the non-navigation actions
 * (open the brief dialog, jump to an anchor, open WhatsApp).
 */
function ElementLink({
  link,
  className,
  style,
  children,
  ...rest
}: {
  link: LinkValue;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Record<string, unknown>) {
  const { data: settings } = useSiteSettings();

  if (link.action === "start_project") {
    return (
      <StartProjectDialog className={className} style={style} {...rest}>
        <>{children}</>
      </StartProjectDialog>
    );
  }

  if (link.action === "whatsapp") {
    const number = (settings?.contacts.whatsapp ?? "").replace(/\D/g, "");
    return (
      <a
        href={`https://wa.me/${number}`}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
        style={style}
        {...rest}
      >
        {children}
      </a>
    );
  }

  const href = link.href || "#";
  const external =
    /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");

  if (external || link.action === "scroll_to" || href.startsWith("#")) {
    return (
      <a
        href={href}
        target={link.target}
        rel={link.rel || (link.target === "_blank" ? "noreferrer noopener" : undefined)}
        className={className}
        style={style}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href as "/"} target={link.target} className={className} style={style} {...rest}>
      {children}
    </Link>
  );
}

const buttonVariants: Record<string, string> = {
  accent: "bg-accent text-accent-foreground hover:-translate-y-0.5",
  primary: "bg-primary text-primary-foreground hover:-translate-y-0.5",
  outline: "border border-border text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  link: "text-foreground underline underline-offset-4",
};
const buttonSizes: Record<string, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3.5 text-sm",
  lg: "px-8 py-4 text-base",
};
const buttonShapes: Record<string, string> = {
  pill: "rounded-full",
  rounded: "rounded-lg",
  square: "rounded-none",
};

/* ------------------------------------------------------------------ */
/* Widgets                                                             */
/* ------------------------------------------------------------------ */

function Heading({ element }: { element: BuilderElement }) {
  const level = propString(element.props, "level", "h2");
  const Tag = (["h1", "h2", "h3", "h4"].includes(level) ? level : "h2") as "h1";
  const display = propBoolean(element.props, "display", true);
  const align = propString(element.props, "align", "left");
  return (
    <Tag
      className={cn(
        display ? "display text-[clamp(1.8rem,4.5vw,3.4rem)]" : "text-2xl font-semibold",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      {propString(element.props, "text")}
      {propBoolean(element.props, "accentDot") ? <span className="text-accent">.</span> : null}
    </Tag>
  );
}

function Text({ element }: { element: BuilderElement }) {
  const size = propString(element.props, "size", "base");
  const align = propString(element.props, "align", "left");
  return (
    <p
      className={cn(
        "leading-relaxed",
        size === "sm" && "text-sm",
        size === "lg" && "text-lg",
        propBoolean(element.props, "muted", true) && "text-muted-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      {propString(element.props, "text")}
    </p>
  );
}

function Button({ element }: { element: BuilderElement }) {
  const link = readLink(element.props["link"]);
  const iconName = propString(element.props, "icon");
  return (
    <ElementLink
      link={link}
      className={cn(
        "group inline-flex min-h-11 items-center justify-center gap-2 font-medium transition-transform",
        buttonVariants[propString(element.props, "variant", "accent")] ?? buttonVariants["accent"],
        buttonSizes[propString(element.props, "size", "md")] ?? buttonSizes["md"],
        buttonShapes[propString(element.props, "shape", "pill")] ?? buttonShapes["pill"],
        propBoolean(element.props, "fullWidth") && "w-full",
      )}
    >
      {propString(element.props, "label", "Button")}
      {iconName ? icon(iconName) : null}
    </ElementLink>
  );
}

function ListWidget({ element }: { element: BuilderElement }) {
  const style = propString(element.props, "style", "chips");
  const items = propList(element.props, "items");
  if (style === "chips") {
    return (
      <ul className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li key={index} className="chip">
            {propString(item, "text")}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={cn("space-y-2", style === "bullets" && "list-disc pl-5")}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 leading-relaxed">
          {style === "checks" ? icon("Check", "mt-1 h-4 w-4 shrink-0 text-accent") : null}
          <span>{propString(item, "text")}</span>
        </li>
      ))}
    </ul>
  );
}

function Cards({ element }: { element: BuilderElement }) {
  const variant = propString(element.props, "variant", "soft");
  const items = propList(element.props, "items");
  return (
    <div
      className="grid gap-5"
      style={{
        gridTemplateColumns: `repeat(${propNumber(element.props, "columns", 3)}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item, index) => {
        const link = readLink(item["link"]);
        const body = (
          <>
            {propString(item, "image") ? (
              <img
                src={propString(item, "image")}
                alt={propString(item, "title")}
                loading="lazy"
                className="mb-6 aspect-[16/9] w-full rounded-lg object-cover"
              />
            ) : null}
            {propString(item, "eyebrow") ? (
              <span className="label-mono text-accent">{propString(item, "eyebrow")}</span>
            ) : null}
            <h3 className="display mt-4 text-2xl">{propString(item, "title")}</h3>
            <p className="mt-4 leading-relaxed text-muted-foreground">{propString(item, "body")}</p>
          </>
        );
        const className = cn(
          "flex flex-col p-8",
          variant === "soft" && "soft-card",
          variant === "bordered" && "rounded-[var(--radius)] border border-border",
        );
        return link.href || link.action !== "navigate" ? (
          <ElementLink key={index} link={link} className={className}>
            {body}
          </ElementLink>
        ) : (
          <article key={index} className={className}>
            {body}
          </article>
        );
      })}
    </div>
  );
}

function Stats({ element }: { element: BuilderElement }) {
  const items = propList(element.props, "items");
  return (
    <div
      className="grid gap-8"
      style={{
        gridTemplateColumns: `repeat(${propNumber(element.props, "columns", 4)}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          <p className="display text-3xl md:text-4xl">{propString(item, "value")}</p>
          <p className="label-mono mt-3 opacity-60">{propString(item, "label")}</p>
        </div>
      ))}
    </div>
  );
}

function Accordion({ element }: { element: BuilderElement }) {
  const items = propList(element.props, "items");
  return (
    <div className="border-t border-border">
      {items.map((item, index) => (
        <details key={index} className="group border-b border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-base">
            {propString(item, "question")}
            {icon("ChevronDown", "h-4 w-4 text-accent transition-transform group-open:rotate-180")}
          </summary>
          <p className="max-w-2xl pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">
            {propString(item, "answer")}
          </p>
        </details>
      ))}
    </div>
  );
}

function ImageWidget({ element }: { element: BuilderElement }) {
  const src = propString(element.props, "src");
  const ratio = propString(element.props, "ratio", "16/9");
  const link = readLink(element.props["link"]);
  if (!src) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Choose an image
      </div>
    );
  }
  const image = (
    <img
      src={src}
      alt={propString(element.props, "alt")}
      loading="lazy"
      className={cn(
        "h-auto w-full",
        propBoolean(element.props, "rounded", true) && "rounded-[var(--radius)]",
        propString(element.props, "fit", "cover") === "contain" ? "object-contain" : "object-cover",
      )}
      style={ratio === "auto" ? undefined : { aspectRatio: ratio }}
    />
  );
  return link.href || link.action !== "navigate" ? (
    <ElementLink link={link} className="block">
      {image}
    </ElementLink>
  ) : (
    image
  );
}

const logoFiles: Record<string, string> = {
  onWhite: "/TRIAD_LOGO_ON WHITE.svg",
  onDark: "/TRIAD_LOGO_ON DARK.png",
  onRed: "/TRIAD_LOGO_ON RED.svg",
  onYellow: "/TRIAD_LOGO_ON YELLOW.svg",
};

function Logo({ element }: { element: BuilderElement }) {
  const { data: settings } = useSiteSettings();
  const variant = propString(element.props, "variant", "onWhite");
  const custom = propString(element.props, "custom");
  const src =
    variant === "custom"
      ? custom || settings?.branding.logo_url || logoFiles["onWhite"]!
      : (logoFiles[variant] ?? logoFiles["onWhite"]!);
  const link = readLink(element.props["link"]);
  const image = (
    <img
      src={src}
      alt="Triad Brands"
      style={{ height: `${propNumber(element.props, "height", 36)}px` }}
      className="w-auto"
    />
  );
  return link.href ? (
    <ElementLink link={link} className="inline-flex">
      {image}
    </ElementLink>
  ) : (
    image
  );
}

function IconWidget({ element }: { element: BuilderElement }) {
  const size = propNumber(element.props, "size", 20);
  const body = icon(propString(element.props, "icon", "Sparkles"), "");
  const inner = (
    <span
      className={cn(
        "inline-grid place-items-center",
        propBoolean(element.props, "tile", true) && "h-11 w-11 rounded-lg bg-accent/10 text-accent",
      )}
      style={{ color: propString(element.props, "color") || undefined }}
    >
      <span style={{ width: size, height: size, display: "grid", placeItems: "center" }}>
        {body}
      </span>
    </span>
  );
  const link = readLink(element.props["link"]);
  return link.href ? <ElementLink link={link}>{inner}</ElementLink> : inner;
}

function Video({ element }: { element: BuilderElement }) {
  const src = propString(element.props, "src");
  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Add a video URL
      </div>
    );
  }
  return (
    <video
      src={src}
      poster={propString(element.props, "poster") || undefined}
      controls={propBoolean(element.props, "controls", true)}
      autoPlay={propBoolean(element.props, "autoplay")}
      loop={propBoolean(element.props, "loop", true)}
      muted={propBoolean(element.props, "muted", true)}
      playsInline
      className="w-full rounded-[var(--radius)]"
    />
  );
}

function Nav({ element }: { element: BuilderElement }) {
  const { data: settings } = useSiteSettings();
  const custom = propList(element.props, "items");
  const items =
    propString(element.props, "source", "settings") === "settings"
      ? (settings?.navigation ?? []).map((entry) => ({
          label: entry.label,
          link: { ...emptyLink, href: entry.href, target: entry.target ?? "_self" },
        }))
      : custom.map((item) => ({ label: propString(item, "label"), link: readLink(item["link"]) }));
  return (
    <nav
      className={cn(
        "flex gap-7",
        propString(element.props, "direction", "row") === "column" ? "flex-col" : "flex-row",
      )}
    >
      {items.map((item, index) => (
        <ElementLink
          key={index}
          link={item.link}
          className="label-mono text-muted-foreground transition-colors hover:text-foreground"
        >
          {item.label}
        </ElementLink>
      ))}
    </nav>
  );
}

function Social({ element }: { element: BuilderElement }) {
  const { data: managed } = useSocialLinks();
  const size = propNumber(element.props, "size", 18);
  const showLabels = propBoolean(element.props, "showLabels");
  const items =
    propString(element.props, "source", "settings") === "settings"
      ? (managed ?? []).map((entry) => ({
          label: entry.label,
          iconName: entry.icon_key,
          link: { ...emptyLink, href: entry.href, target: "_blank" as const },
        }))
      : propList(element.props, "items").map((item) => ({
          label: propString(item, "label"),
          iconName: propString(item, "icon", "Globe"),
          link: readLink(item["link"]),
        }));
  const iconFor: Record<string, string> = {
    instagram: "Instagram",
    linkedin: "Linkedin",
    facebook: "Facebook",
    twitter: "Twitter",
    x: "Twitter",
    youtube: "Youtube",
  };
  return (
    <div className="flex flex-wrap items-center gap-4">
      {items.map((item, index) => (
        <ElementLink
          key={index}
          link={item.link}
          className="inline-flex items-center gap-2 opacity-70 transition-opacity hover:opacity-100"
          aria-label={item.label}
        >
          <span style={{ width: size, height: size, display: "grid", placeItems: "center" }}>
            {icon(iconFor[item.iconName?.toLowerCase() ?? ""] ?? item.iconName ?? "Globe", "")}
          </span>
          {showLabels ? <span className="text-sm">{item.label}</span> : null}
        </ElementLink>
      ))}
    </div>
  );
}

function Products({ element }: { element: BuilderElement }) {
  const { data } = useProducts();
  const filter = propString(element.props, "filter", "featured");
  const category = propString(element.props, "category");
  const limit = propNumber(element.props, "limit", 6);
  const products = (data ?? [])
    .filter((product) => {
      if (filter === "featured") return product.featured;
      if (filter === "category") {
        return product.category.trim().toLowerCase() === category.trim().toLowerCase();
      }
      return true;
    })
    .slice(0, limit);

  return (
    <div
      className="grid gap-5"
      style={{
        gridTemplateColumns: `repeat(${propNumber(element.props, "columns", 3)}, minmax(0, 1fr))`,
      }}
    >
      {products.map((product) => (
        <Link
          key={product.id}
          to="/product/$id"
          params={{ id: product.id }}
          className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card"
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : null}
          <div className="flex flex-1 flex-col p-6">
            <span className="label-mono text-accent">{product.category}</span>
            <h3 className="mt-3 text-lg font-semibold">{product.title}</h3>
            {propBoolean(element.props, "showPrice", true) ? (
              <p className="mt-auto pt-6 text-lg font-medium">{formatKES(product.price_from)}</p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function Services({ element }: { element: BuilderElement }) {
  const { data } = useServices();
  const services = (data ?? []).slice(0, propNumber(element.props, "limit", 12));
  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${propNumber(element.props, "columns", 2)}, minmax(0, 1fr))`,
      }}
    >
      {services.map((service) => (
        <article key={service.name} className="soft-card p-8">
          <span className="pill">{service.tag}</span>
          <h3 className="display mt-10 text-2xl">{service.name}</h3>
          <p className="mt-4 leading-relaxed text-muted-foreground">{service.detail}</p>
        </article>
      ))}
    </div>
  );
}

function Categories({ element }: { element: BuilderElement }) {
  const { data: products } = useProducts();
  const columns = propNumber(element.props, "columns", 4);

  // "catalog" derives the grid from live product categories and falls back to
  // the built-in cards when the catalog is empty, so the section is never blank.
  const live = Array.from(
    new Map((products ?? []).map((product) => [product.category.trim().toLowerCase(), product])),
  ).map(([, product]) => ({
    id: product.category,
    label: product.category,
    description: product.subtitle || product.description,
    image: product.images?.[0] ?? "",
    icon: "Gift",
    link: {
      ...emptyLink,
      href: `/category/${product.category
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
    },
  }));

  const cards =
    propString(element.props, "source", "catalog") === "custom"
      ? propList(element.props, "items").map((item) => ({
          id: propString(item, "label"),
          label: propString(item, "label"),
          description: propString(item, "description"),
          image: propString(item, "image"),
          icon: propString(item, "icon", "Gift"),
          link: readLink(item["link"]),
        }))
      : live.length
        ? live
        : categoryCards.map((category) => ({
            id: category.id,
            label: category.name,
            description: category.blurb,
            image: category.img,
            icon: "Gift",
            link: { ...emptyLink, href: `/category/${category.id}` },
          }));

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cards.map((card) => (
        <ElementLink
          key={card.id}
          link={card.link}
          className="group flex min-h-[22rem] flex-col overflow-hidden rounded-xl bg-background shadow-[0_10px_30px_-24px_oklch(0.209_0.079_271.5/45%)] transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="flex flex-1 flex-col p-7">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
              {icon(card.icon, "h-5 w-5")}
            </span>
            <h3 className="mt-8 text-lg font-medium tracking-tight">{card.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
          </div>
          {card.image ? (
            <img
              src={card.image}
              alt={card.label}
              loading="lazy"
              className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : null}
        </ElementLink>
      ))}
    </div>
  );
}

function Projects({ element }: { element: BuilderElement }) {
  const { data } = useProjects();
  const projects = (data ?? []).slice(0, propNumber(element.props, "limit", 6));
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${propNumber(element.props, "columns", 2)}, minmax(0, 1fr))`,
      }}
    >
      {projects.map((project) => (
        <Link
          key={project.slug}
          to="/work/$slug"
          params={{ slug: project.slug }}
          className="group block"
        >
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.title}
              loading="lazy"
              className="h-64 w-full rounded-[var(--radius)] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : null}
          <h3 className="mt-5 text-lg font-medium tracking-tight">{project.title}</h3>
          <p className="label-mono mt-2 text-muted-foreground">{project.meta}</p>
        </Link>
      ))}
    </div>
  );
}

function Hero({ element }: { element: BuilderElement }) {
  const { data: remote } = useHeroSlides();
  const [index, setIndex] = useState(0);
  const slides = remote?.length
    ? remote.map((slide) => ({
        id: slide.id,
        img: slide.image_url ?? heroSlides[0]!.img,
        eyebrow: slide.eyebrow,
        title: slide.headline,
        body: slide.subtext,
      }))
    : heroSlides.map((slide) => ({ ...slide }));

  const count = slides.length;
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), 6500);
    return () => clearInterval(timer);
  }, [count]);

  if (!count) return null;
  const slide = slides[index % count]!;

  return (
    <div
      className="relative overflow-hidden rounded-[calc(var(--radius)+0.5rem)]"
      style={{ minHeight: `${propNumber(element.props, "minHeight", 560)}px` }}
    >
      {slides.map((candidate, candidateIndex) => (
        <img
          key={candidate.id}
          src={candidate.img}
          alt={candidate.eyebrow}
          {...(candidateIndex === 0 ? {} : { loading: "lazy" as const })}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            candidateIndex === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,19,49,0.86)_0%,rgba(14,19,49,0.62)_52%,rgba(14,19,49,0.3)_100%)]" />
      <div className="relative flex flex-col justify-center px-6 py-24 text-primary-foreground md:px-16">
        <span className="label-mono border-l-2 border-accent pl-3 text-primary-foreground/75">
          {slide.eyebrow}
        </span>
        <h1 className="display mt-7 max-w-4xl text-[clamp(2.7rem,6.8vw,5.75rem)] text-balance">
          {slide.title}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/75 md:text-lg">
          {slide.body}
        </p>
        {propBoolean(element.props, "showTrustBadges", true) ? (
          <ul className="mt-12 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
            {trustBadges.map((badge) => (
              <li
                key={badge}
                className="label-mono flex items-center justify-center gap-2 border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3"
              >
                {icon("Check", "h-3.5 w-3.5 shrink-0 text-amber")}
                {badge}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Element switch                                                      */
/* ------------------------------------------------------------------ */

function WidgetBody({ element }: { element: BuilderElement }) {
  switch (element.type) {
    case "heading":
      return <Heading element={element} />;
    case "text":
      return <Text element={element} />;
    case "eyebrow":
      return (
        <p
          className={cn(
            "label-mono",
            propBoolean(element.props, "accent", true) ? "text-accent" : "text-muted-foreground",
          )}
        >
          {propString(element.props, "text")}
        </p>
      );
    case "button":
      return <Button element={element} />;
    case "list":
      return <ListWidget element={element} />;
    case "cards":
      return <Cards element={element} />;
    case "stats":
      return <Stats element={element} />;
    case "accordion":
      return <Accordion element={element} />;
    case "image":
      return <ImageWidget element={element} />;
    case "logo":
      return <Logo element={element} />;
    case "icon":
      return <IconWidget element={element} />;
    case "video":
      return <Video element={element} />;
    case "nav":
      return <Nav element={element} />;
    case "social":
      return <Social element={element} />;
    case "products":
      return <Products element={element} />;
    case "services":
      return <Services element={element} />;
    case "categories":
      return <Categories element={element} />;
    case "projects":
      return <Projects element={element} />;
    case "hero":
      return <Hero element={element} />;
    case "spacer":
      return <div style={{ height: `${propNumber(element.props, "height", 48)}px` }} />;
    case "divider":
      return (
        <hr
          style={{
            borderTopWidth: `${propNumber(element.props, "thickness", 1)}px`,
            borderColor: propString(element.props, "color") || undefined,
          }}
          className="border-border"
        />
      );
    case "form":
      return (
        <StartProjectDialog
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium",
            buttonVariants[propString(element.props, "variant", "accent")],
          )}
        >
          <>{propString(element.props, "label", "Start the brief")}</>
        </StartProjectDialog>
      );
    default:
      return null;
  }
}

export function RenderElement({ element }: { element: BuilderElement }) {
  const widgetStyle = layoutStyle(element);
  const common = {
    "data-builder-id": element.id,
    "data-builder-type": element.type,
  } as Record<string, string>;

  if (element.type === "section") {
    const maxWidth = propString(element.props, "maxWidth", "1400");
    const Tag = (propString(element.props, "tag", "section") || "section") as "section";
    return (
      <Tag {...common} className="px-6 md:px-12">
        <div
          className="mx-auto w-full"
          style={maxWidth === "full" ? undefined : { maxWidth: `${maxWidth}px` }}
        >
          {element.children.map((child) => (
            <RenderElement key={child.id} element={child} />
          ))}
        </div>
      </Tag>
    );
  }

  if (element.type === "container" || element.type === "grid") {
    return (
      <div {...common} style={widgetStyle}>
        {element.children.map((child) => (
          <RenderElement key={child.id} element={child} />
        ))}
      </div>
    );
  }

  return (
    <div {...common}>
      <WidgetBody element={element} />
    </div>
  );
}

/**
 * Renders a full builder document. The scoped stylesheet carries every
 * per-breakpoint override, so the published page looks identical to the canvas.
 */
export function BuilderCanvasContent({ root }: { root: BuilderElement[] }) {
  const css = `${documentCss(root)}\n${documentLayoutCss(root)}`.trim();
  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {root.map((element) => (
        <RenderElement key={element.id} element={element} />
      ))}
    </>
  );
}
