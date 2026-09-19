import { createFileRoute } from "@tanstack/react-router";
import { PublishedPage } from "@/components/PublishedPage";
import { usePublishedPage } from "@/lib/storefront";

export const Route = createFileRoute("/cookies")({
  component: CookiesPage,
  head: () => ({
    meta: [{ title: "Cookie Policy — Triad Studio" }],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
});

function CookiesPage() {
  const { data: pageDocument } = usePublishedPage("cookies");
  return pageDocument ? <PublishedPage document={pageDocument} /> : null;
}
