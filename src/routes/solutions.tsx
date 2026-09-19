import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { services, process } from "@/lib/site-data";
import { useServices, usePublishedPage } from "@/lib/storefront";
import { PublishedPage } from "@/components/PublishedPage";
import { StartProjectDialog } from "@/components/StartProjectDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/solutions")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services — Branding, Digital, Print & Merch | Triad Studio" },
      {
        name: "description",
        content:
          "Brand identity, digital design, print production, large format, branded merchandise, event collateral, art direction and brand rollout — all from one Nairobi studio.",
      },
      { property: "og:title", content: "Services — Triad Studio" },
      {
        property: "og:description",
        content:
          "Eight disciplines under one roof: identity, digital, print, large format, merch, events, art direction and rollout.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/solutions" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/solutions" }],
  }),
});

function ServicesPage() {
  const { data: pageDocument } = usePublishedPage("solutions");
  const { data: managedServices } = useServices();
  const visibleServices = managedServices?.length ? managedServices : services;
  const [selectedService, setSelectedService] = useState<(typeof visibleServices)[number] | null>(
    null,
  );
  if (pageDocument) return <PublishedPage document={pageDocument} />;
  return (
    <>
      <section className="mx-auto max-w-[1400px] px-6 pb-16 pt-16 md:px-12 md:pb-20 md:pt-24">
        <p className="label-mono text-accent">Services</p>
        <h1 className="display mt-6 max-w-5xl text-[clamp(2.4rem,7vw,6rem)]">
          Make the brand
          <br />
          impossible to miss<span className="text-accent">.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Strategy, design and production in one connected team. Bring us the brief, the deadline,
          or the problem that still feels fuzzy. We will turn it into something people can see, use
          and remember.
        </p>
        <div className="mt-10 flex flex-wrap gap-2 text-muted-foreground">
          <span className="chip">Identity</span>
          <span className="chip">Digital</span>
          <span className="chip">Production</span>
          <span className="chip">Merchandise</span>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32">
        <div className="grid gap-3 md:grid-cols-2">
          {visibleServices.map((s, i) => {
            const href = s.categoryHref ?? "/category/promo";
            return (
              <div
                key={s.name}
                className={`soft-card flex flex-col justify-between p-8 md:p-10 ${
                  i % 5 === 1 ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <span className={`pill ${i % 5 === 1 ? "border-primary-foreground/25" : ""}`}>
                    {s.tag}
                  </span>
                  <span className="label-mono opacity-40">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-16">
                  <h2 className="display text-2xl md:text-3xl">{s.name}</h2>
                  <p
                    className={`mt-4 leading-relaxed ${
                      i % 5 === 1 ? "opacity-70" : "text-muted-foreground"
                    }`}
                  >
                    {s.detail}.
                  </p>
                  <ul className="mt-8 flex flex-wrap gap-2">
                    {s.deliverables.map((d) => (
                      <li
                        key={d}
                        className={`label-mono rounded-full border px-3 py-1.5 ${
                          i % 5 === 1 ? "border-primary-foreground/25" : "border-border"
                        }`}
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedService(s)}
                    className={`inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-xs font-medium ${
                      i % 5 === 1
                        ? "border-primary-foreground/30 text-primary-foreground"
                        : "border-border text-foreground"
                    }`}
                  >
                    Quick view
                  </button>
                  <Link
                    to={href as "/category/$slug"}
                    params={{ slug: href.split("/").pop() ?? "promo" }}
                    className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-xs font-medium ${
                      i % 5 === 1 ? "bg-white text-primary" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    Explore
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-3 pb-24 md:px-6 md:pb-32">
        <div className="mx-auto max-w-[1400px] rounded-[var(--radius)] bg-muted/50 px-6 py-20 md:px-14 md:py-28">
          <p className="label-mono text-accent">From first question to final delivery</p>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {process.map((p) => (
              <div key={p.n} className="border-t border-border pt-6">
                <span className="label-mono text-muted-foreground">{p.n}</span>
                <h2 className="display mt-6 text-2xl md:text-3xl">{p.title}</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-16">
            <StartProjectDialog className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">
              <>
                Start a project
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </>
            </StartProjectDialog>
          </div>
        </div>
      </section>
      {selectedService ? (
        <Dialog
          open={Boolean(selectedService)}
          onOpenChange={(open) => !open && setSelectedService(null)}
        >
          <DialogContent className="max-w-2xl border-0 bg-background p-0">
            <div className="p-6 md:p-8">
              <DialogHeader className="text-left">
                <p className="label-mono text-accent">{selectedService.tag}</p>
                <DialogTitle className="mt-2 text-3xl font-semibold">
                  {selectedService.name}
                </DialogTitle>
                <DialogDescription className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {selectedService.detail}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 space-y-4 rounded-[var(--radius)] border border-border bg-muted/30 p-4">
                <p className="label-mono text-foreground">What’s included</p>
                <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {selectedService.deliverables.map((deliverable) => (
                    <li
                      key={deliverable}
                      className="rounded-xl border border-border bg-background/60 px-3 py-2"
                    >
                      {deliverable}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <StartProjectDialog className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background">
                  <>Request a quote</>
                </StartProjectDialog>
                <Link
                  to={selectedService.categoryHref ?? "/category/promo"}
                  params={{
                    slug:
                      (selectedService.categoryHref ?? "/category/promo").split("/").pop() ??
                      "promo",
                  }}
                  onClick={() => setSelectedService(null)}
                  className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                >
                  Explore this service
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
