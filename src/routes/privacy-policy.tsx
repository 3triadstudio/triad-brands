import { createFileRoute } from "@tanstack/react-router";
import { PublishedPage } from "@/components/PublishedPage";
import { usePublishedPage } from "@/lib/storefront";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [{ title: "Privacy Policy — Triad Studio" }],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
});

function PrivacyPolicyPage() {
  const { data: pageDocument } = usePublishedPage("privacy");
  return pageDocument ? <PublishedPage document={pageDocument} /> : null;
}
