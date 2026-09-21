import { createFileRoute } from "@tanstack/react-router";
import { StructuredPageBuilder } from "@/components/admin/StructuredPageBuilder";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: () => <StructuredPageBuilder initialStudio="categories" />,
});
