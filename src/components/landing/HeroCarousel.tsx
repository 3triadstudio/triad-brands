import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { heroSlides, trustBadges } from "@/lib/catalog-data";
import { StartProjectDialog } from "@/components/StartProjectDialog";
import { cn } from "@/lib/utils";
import { optimizeImageUrl, responsiveImageSrcSet } from "@/lib/utils";
import { useHeroSlides } from "@/lib/storefront";

export function HeroCarousel({
  content = {},
  design = {},
  items = [],
}: {
  content?: Record<string, string>;
  design?: CSSProperties;
  items?: {
    id: string;
    label: string;
    description: string;
    href: string;
    image?: string;
    visible?: boolean;
    sortOrder?: number;
  }[];
}) {
  const [i, setI] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { data: remoteSlides } = useHeroSlides();
  const slides = remoteSlides?.length
    ? remoteSlides.map((slide) => ({
        id: slide.id,
        img: slide.image_url ?? heroSlides[0]!.img,
        eyebrow: slide.eyebrow,
        title: slide.headline,
        body: slide.subtext,
      }))
    : heroSlides;
  const documentSlides = items.length
    ? items
        .filter((item) => item.visible !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((item) => ({
          id: item.id,
          img: item.image ?? heroSlides[0]!.img,
          eyebrow: item.label,
          title: item.label,
          body: item.description,
        }))
    : slides;
  const count = documentSlides.length;
  const go = useCallback((n: number) => setI((c) => (c + n + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const t = setInterval(() => setI((c) => (c + 1) % count), 6500);
    return () => clearInterval(t);
  }, [count, isPaused]);

  if (!count) return null;
  const slide = documentSlides[i % count]!;
  const ctaButtonStyle = {
    backgroundColor: content["hero.cta_button.backgroundColor"],
    color: content["hero.cta_button.color"],
    borderRadius: content["hero.cta_button.borderRadius"],
    fontSize: content["hero.cta_button.fontSize"],
    padding: content["hero.cta_button.padding"],
  } satisfies CSSProperties;

  return (
    <section className="px-3 pt-3 md:px-6 md:pt-5" data-cms-block="hero" style={design}>
      <div
        className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[calc(var(--radius)+0.5rem)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {documentSlides.map((s, idx) =>
          idx === i ? (
            <img
              key={s.id}
              src={optimizeImageUrl(content["hero.image"] ?? s.img, 1280, 65)}
              srcSet={responsiveImageSrcSet(content["hero.image"] ?? s.img, [640, 960, 1280], 65)}
              sizes="100vw"
              alt={s.eyebrow}
              width={1920}
              height={1080}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
              data-cms-field="hero.image"
            />
          ) : null,
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,19,49,0.86)_0%,rgba(14,19,49,0.62)_52%,rgba(14,19,49,0.3)_100%)]" />

        <div className="relative flex min-h-[35rem] flex-col items-center justify-center px-6 py-24 text-center text-primary-foreground md:min-h-[42rem] md:items-start md:px-16 md:text-left">
          <span className="label-mono border-l-2 border-accent pl-3 text-primary-foreground/75">
            <span data-cms-field="hero.eyebrow">{content["hero.eyebrow"] ?? slide.eyebrow}</span>
          </span>
          <h1 className="display mt-7 max-w-4xl text-[clamp(2.7rem,6.8vw,5.75rem)] text-balance">
            <span data-cms-field="hero.headline">{content["hero.headline"] ?? slide.title}</span>
            <span className="text-accent">.</span>
          </h1>
          <p
            className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/75 md:text-lg"
            data-cms-field="hero.subtext"
          >
            {content["hero.subtext"] ?? slide.body}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <StartProjectDialog
              className="group inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
              style={ctaButtonStyle}
              data-cms-field="hero.cta_button"
            >
              <span data-cms-field="hero.cta_label">
                {content["hero.cta_label"] ?? "Request a custom quote"}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </StartProjectDialog>
            <Link
              to="/shop"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-6 py-3.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-primary-foreground/20"
            >
              Browse the catalog
            </Link>
          </div>

          <ul className="mt-12 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
            {trustBadges.map((b) => (
              <li
                key={b}
                className="label-mono flex items-center justify-center gap-2 border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 backdrop-blur-sm"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-amber" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => go(-1)}
          className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 p-3 text-primary-foreground backdrop-blur-md transition-colors hover:bg-primary-foreground/25 md:block"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => go(1)}
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 p-3 text-primary-foreground backdrop-blur-md transition-colors hover:bg-primary-foreground/25 md:block"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2"
          aria-label="Hero slides"
        >
          {documentSlides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-[width,background-color]",
                  idx === i ? "w-8 bg-accent" : "w-3 bg-primary-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
