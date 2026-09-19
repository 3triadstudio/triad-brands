import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { StartProjectDialog } from "@/components/StartProjectDialog";

export function PromoBanner({
  content = {},
  design = {},
}: {
  content?: Record<string, string>;
  design?: CSSProperties;
}) {
  return (
    <section className="px-3 pt-20 md:px-6 md:pt-28" data-cms-block="promo" style={design}>
      <div className="glow-panel star-field mx-auto flex max-w-[1400px] flex-col items-start gap-8 rounded-xl px-5 py-14 text-primary-foreground sm:px-8 md:flex-row md:items-center md:justify-between md:px-14 md:py-20">
        <div className="max-w-2xl">
          <p className="label-mono opacity-70" data-cms-field="promo.eyebrow">
            {content["promo.eyebrow"] ?? "Seasonal offer"}
          </p>
          <h2
            className="display mt-5 text-[clamp(1.8rem,4vw,3.2rem)]"
            data-cms-field="promo.heading"
          >
            {content["promo.heading"] ??
              "Corporate event bundles — up to 15% off large volume orders"}
            <span className="text-amber">.</span>
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-primary-foreground/70" data-cms-field="promo.body">
            {content["promo.body"] ??
              "Combine apparel, event gear and gifting in one production run and we price the whole bundle together."}
          </p>
        </div>
        <StartProjectDialog className="group inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5">
          <>
            <span data-cms-field="promo.cta_label">{content["promo.cta_label"] ?? "Get Bulk Estimate"}</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </>
        </StartProjectDialog>
      </div>
    </section>
  );
}
