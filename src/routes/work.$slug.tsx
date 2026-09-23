import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { work } from "@/lib/site-data";
import { supabase } from "@/integrations/supabase/client";
import { legacyBlocks, useProjects, usePublishedPage } from "@/lib/storefront";
import { breadcrumbLd, pageSeo } from "@/lib/seo";
import { StartProjectDialog } from "@/components/StartProjectDialog";

export const Route = createFileRoute("/work/$slug")({
  loader: async ({ params }) => {
    const fallback = work.find((item) => item.slug === params.slug);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (!data && !fallback) throw notFound();
    const fallbackImage = work[0]?.img ?? "";
    return {
      project: data
        ? { ...data, img: data.image_url || fallback?.img || fallbackImage }
        : (fallback ?? {
            id: "fallback",
            slug: params.slug,
            title: "Project",
            summary: "Project details unavailable.",
            img: fallbackImage,
            label: "",
            category: "",
            client: "",
            year: "",
            services: [],
            body: [],
          }),
    };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Project unavailable | Triad Brands" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { project } = loaderData;
    const seo = pageSeo({
      path: `/work/${params.slug}`,
      title: `${project.title} | Triad Brands`,
      description: project.summary,
      type: "article",
    });
    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbLd([
              { name: "Home", path: "/" },
              { name: project.title, path: `/work/${params.slug}` },
            ]),
          ),
        },
      ],
    };
  },
  component: WorkDetail,
});

function WorkDetail() {
  const { project } = Route.useLoaderData();
  const { data: managedProjects } = useProjects();
  const { data: pageDocument } = usePublishedPage("work");
  const projectsBlock = legacyBlocks(pageDocument).find((block) => block.id === "work_projects");
  const others = (
    managedProjects?.length
      ? managedProjects.map((item, index) => ({
          ...item,
          img: item.image_url || work[index % work.length]?.img,
        }))
      : work
  ).filter((item) => item.slug !== project.slug);

  return (
    <>
      <section className="mx-auto max-w-[1400px] px-6 pb-12 pt-16 md:px-12 md:pt-24">
        <Link
          to="/shop"
          className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to the catalog
        </Link>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <p className="label-mono text-accent">{project.label}</p>
          <span className="h-1 w-1 rounded-full bg-border" />
          <p className="label-mono text-muted-foreground">{project.category}</p>
        </div>
        <h1 className="display mt-6 max-w-5xl text-[clamp(2rem,5.5vw,4.5rem)]">{project.title}</h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {project.summary}
        </p>
      </section>

      <section className="px-3 md:px-6">
        <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[var(--radius)] bg-muted">
          <img
            src={project.img}
            alt={project.title}
            className="h-[28rem] w-full object-cover md:h-[42rem]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-20 md:px-12 md:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          <aside className="space-y-8 md:col-span-4">
            <div className="border-t border-border pt-5">
              <p className="label-mono text-muted-foreground">Client</p>
              <p className="mt-3">{project.client}</p>
            </div>
            <div className="border-t border-border pt-5">
              <p className="label-mono text-muted-foreground">Delivered</p>
              <p className="mt-3">{project.year}</p>
            </div>
            <div className="border-t border-border pt-5">
              <p className="label-mono text-muted-foreground">Services</p>
              <ul className="mt-3 space-y-1">
                {project.services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="space-y-8 md:col-span-8">
            {project.body.map((p) => (
              <p key={p.slice(0, 24)} className="text-lg leading-relaxed">
                {p}
              </p>
            ))}
            <StartProjectDialog className="group mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">
              <>
                Start something similar
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </>
            </StartProjectDialog>
          </div>
        </div>
      </section>

      {projectsBlock?.visible === false ? null : (
        <section
          className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32"
          data-cms-block="work_projects"
        >
          <p className="label-mono text-muted-foreground">More selected work</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {others.map((w) => (
              <Link key={w.slug} to="/work/$slug" params={{ slug: w.slug }} className="group">
                <div className="overflow-hidden rounded-[var(--radius)] bg-muted">
                  <img
                    src={w.img}
                    alt={w.title}
                    loading="lazy"
                    className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <h2 className="mt-5 text-lg font-medium tracking-tight">{w.title}</h2>
                <p className="label-mono mt-2 text-muted-foreground">{w.meta}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
