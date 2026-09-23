import { createFileRoute } from "@tanstack/react-router";
import { PublishedPage } from "@/components/PublishedPage";
import { getDefaultPageDocument } from "@/lib/page-editor";
import { usePublishedPage } from "@/lib/storefront";
import { pageCopy, pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => pageSeo(pageCopy.terms),
});

function TermsPage() {
  const { data: pageDocument } = usePublishedPage("terms");
  // Fall back to the built-in policy document: returning null served a blank
  // page to visitors and crawlers whenever nothing was published in the CMS.
  return <PublishedPage document={pageDocument ?? getDefaultPageDocument("terms")} />;
}
