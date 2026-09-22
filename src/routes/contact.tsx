import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Clock3, Mail, MapPin } from "lucide-react";
import { faqs, socials } from "@/lib/site-data";
import { faqLd, localBusinessLd, pageCopy, pageSeo } from "@/lib/seo";
import { StartProjectDialog } from "@/components/StartProjectDialog";
import { defaultContacts, useSiteSettings, usePublishedPage } from "@/lib/storefront";
import { PublishedPage } from "@/components/PublishedPage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => {
    const seo = pageSeo(pageCopy.contact);
    return {
      ...seo,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(localBusinessLd()) },
        { type: "application/ld+json", children: JSON.stringify(faqLd(faqs)) },
      ],
    };
  },
});

function ContactPage() {
  const { data: pageDocument } = usePublishedPage("contact");
  const { data: settings } = useSiteSettings();
  const email = settings?.contacts.email ?? defaultContacts.email;
  const studio = settings?.seo.studio ?? "Nairobi, Kenya";
  const socialLinks = settings
    ? Object.entries(settings.socials)
        .filter(([, href]) => href)
        .map(([label, href]) => ({ label, href }))
    : socials;
  if (pageDocument) return <PublishedPage document={pageDocument} />;

  return (
    <main className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_42%),linear-gradient(180deg,transparent_0%,color-mix(in_oklab,var(--accent)_8%,transparent)_100%)]" />
      <div className="relative mx-auto max-w-[1120px] px-5 pb-24 pt-20 md:px-10 md:pb-32 md:pt-28">
        <header className="mx-auto max-w-3xl text-center">
          <p className="label-mono text-accent">Contact the studio</p>
          <h1 className="display mt-7 text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.9]">
            Let&apos;s make
            <br />
            something <span className="text-accent">work.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-primary-foreground/65 md:text-lg">
            Tell us what you are building, changing or trying to solve — a brand identity, a print
            run, event branding or branded merchandise. We come back with a useful next step, not a
            generic pitch.
          </p>
        </header>

        <section className="mx-auto mt-16 grid max-w-4xl overflow-hidden border border-primary-foreground/15 bg-primary-foreground/[0.04] md:mt-20 md:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between border-b border-primary-foreground/15 p-7 md:border-b-0 md:border-r md:p-10">
            <div>
              <p className="label-mono text-accent">A considered start</p>
              <h2 className="display mt-6 text-3xl leading-tight md:text-4xl">
                Good work starts with the right question.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-primary-foreground/60">
                A rough idea is enough. Share the context — audience, deadline, quantities — and we
                will help shape the brief around the work that matters.
              </p>
            </div>
            <div className="mt-12 border-t border-primary-foreground/15 pt-6">
              <p className="label-mono text-primary-foreground/45">Studio note</p>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
                &quot;The best projects are clear about the problem, curious about the answer, and
                open to making something useful.&quot;
              </p>
              <p className="mt-5 text-xs text-primary-foreground/45">Triad Brands / Nairobi</p>
            </div>
          </div>

          <div className="p-7 md:p-10">
            <p className="label-mono text-primary-foreground/45">Quick response</p>
            <h2 className="display mt-4 text-3xl md:text-4xl">Start a conversation.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/60">
              The short brief takes about two minutes and goes straight to our WhatsApp, so we can
              come back to you with pricing and timing.
            </p>
            <StartProjectDialog className="group mt-8 inline-flex items-center gap-2 bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition-transform hover:-translate-y-0.5">
              Start the brief
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </StartProjectDialog>
            <div className="mt-10 grid gap-5 border-t border-primary-foreground/15 pt-6 text-sm sm:grid-cols-2">
              <a
                href={`mailto:${email}`}
                className="flex gap-3 text-primary-foreground/70 transition-colors hover:text-accent"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="break-all">{email}</span>
              </a>
              <div className="flex gap-3 text-primary-foreground/70">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>Reply within 1 working day</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-3xl md:mt-32">
          <div className="text-center">
            <p className="label-mono text-accent">Good to know</p>
            <h2 className="display mt-5 text-4xl md:text-5xl">Frequently asked questions.</h2>
          </div>
          <Accordion
            type="single"
            collapsible
            className="mt-10 border-t border-primary-foreground/15"
          >
            {faqs.map(({ q: question, a: answer }, index) => (
              <AccordionItem
                key={question}
                value={`question-${index}`}
                className="border-primary-foreground/15"
              >
                <AccordionTrigger className="py-5 text-left text-base font-normal text-primary-foreground hover:no-underline [&>svg]:text-accent">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl pr-8 text-sm leading-relaxed text-primary-foreground/60">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mx-auto mt-24 max-w-4xl border-t border-primary-foreground/15 pt-8 md:mt-32 md:flex md:items-start md:justify-between md:gap-10">
          <div>
            <p className="label-mono text-primary-foreground/45">Find us online</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-1.5 text-sm text-primary-foreground/65 transition-colors hover:text-accent"
                >
                  {social.label}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 flex gap-3 text-sm text-primary-foreground/60 md:mt-0">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{studio}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
