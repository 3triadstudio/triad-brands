import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { pillars, stats, process } from "@/lib/site-data";
import { StartProjectDialog } from "@/components/StartProjectDialog";
import { usePublishedPage } from "@/lib/storefront";
import { PublishedPage } from "@/components/PublishedPage";

export const Route = createFileRoute("/about")({
  component: StudioPage,
  head: () => ({
    meta: [
      { title: "Studio — Triad Studio, Nairobi" },
      {
        name: "description",
        content:
          "Triad Studio is independently owned and self-funded. Meet the studio behind the branding, digital, print and merchandise work — and how we run projects.",
      },
      { property: "og:title", content: "Studio — Triad Studio" },
      {
        property: "og:description",
        content:
          "Independent, self-funded and selective: how Triad Studio works and why quality beats volume.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

function StudioPage() {
  const { data: pageDocument } = usePublishedPage("about");
  if (pageDocument) return <PublishedPage document={pageDocument} />;
  return (
    <>
      <section className="mx-auto max-w-[1400px] px-6 pb-20 pt-16 md:px-12 md:pb-28 md:pt-24">
        <p className="label-mono text-accent">Studio</p>
        <h1 className="display mt-6 max-w-5xl text-[clamp(2.4rem,7vw,6rem)]">
          Small enough to care.
          <br />
          Serious enough to deliver<span className="text-accent">.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Triad is an independent Nairobi studio for brands that need more than a logo and less than
          a revolving door of suppliers.
        </p>
        <div className="mt-12 grid gap-10 border-t border-border pt-12 md:grid-cols-12">
          <p className="label-mono text-muted-foreground md:col-span-4">The short version</p>
          <div className="space-y-6 text-lg leading-relaxed md:col-span-8">
            <p>
              We connect the thinking, the making and the delivery. That means the identity on
              screen still feels like the one on the banner, the garment, or the box.
            </p>
            <p className="text-muted-foreground">
              We stay close to the work, keep the team lean, and choose projects where clarity and
              craft can make a visible difference.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32">
        <div className="grid gap-3 md:grid-cols-3">
          {pillars.map((p) => (
            <article key={p.n} className="soft-card p-8 md:p-10">
              <span className="label-mono text-accent">{p.n}</span>
              <h2 className="display mt-10 text-2xl md:text-3xl">{p.title}</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-3 md:px-6">
        <div className="mx-auto max-w-[1400px] rounded-[var(--radius)] bg-primary px-6 py-20 text-primary-foreground md:px-14 md:py-28">
          <p className="label-mono opacity-60">A better way to move from idea to in-market</p>
          <div className="mt-14 grid gap-12 md:grid-cols-3">
            {process.map((s) => (
              <div key={s.n} className="border-t border-primary-foreground/15 pt-6">
                <span className="label-mono text-amber">{s.n}</span>
                <h2 className="display mt-6 text-2xl md:text-3xl">{s.title}</h2>
                <p className="mt-4 leading-relaxed opacity-70">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-20 grid gap-8 border-t border-primary-foreground/15 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.k}>
                <p className="display text-3xl md:text-4xl">{s.k}</p>
                <p className="label-mono mt-3 opacity-60">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-8 px-6 py-24 md:px-12 md:py-32">
        <h2 className="display max-w-2xl text-[clamp(1.8rem,4.5vw,3.4rem)]">
          Bring the brief. We will bring the point of view<span className="text-amber">.</span>
        </h2>
        <div className="flex flex-wrap gap-3">
          <StartProjectDialog className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-medium text-accent-foreground transition-transform hover:-translate-y-0.5">
            <>
              Start a project
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          </StartProjectDialog>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            See the work
          </Link>
        </div>
      </section>
    </>
  );
}
