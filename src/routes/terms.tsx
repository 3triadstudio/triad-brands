import { createFileRoute } from "@tanstack/react-router";
import { PublishedPage } from "@/components/PublishedPage";
import { usePublishedPage } from "@/lib/storefront";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [{ title: "Terms of Use — Triad Brands" }],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

function TermsPage() {
  const { data: pageDocument } = usePublishedPage("terms");
  return pageDocument ? <PublishedPage document={pageDocument} /> : null;
}
