import { createFileRoute } from "@tanstack/react-router";
import { PublishedPage } from "@/components/PublishedPage";
import { getDefaultPageDocument } from "@/lib/page-editor";
import { usePublishedPage } from "@/lib/storefront";
import { pageCopy, pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => pageSeo(pageCopy.privacy),
});

function PrivacyPolicyPage() {
  const { data: pageDocument } = usePublishedPage("privacy");
  // Fall back to the built-in policy document: returning null served a blank
  // page to visitors and crawlers whenever nothing was published in the CMS.
  return <PublishedPage document={pageDocument ?? getDefaultPageDocument("privacy")} />;
}
