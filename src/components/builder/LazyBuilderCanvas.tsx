import { lazy, Suspense, type ReactNode } from "react";
import type { BuilderElement } from "@/lib/builder/types";

// BuilderRenderer is a general-purpose block renderer (hero carousels, product
// grids, service lists, CSS-in-JS layout generation, ...) — real weight, not
// bloat. It's only needed on the (typically rare) pages/regions someone has
// actually published through the visual builder, so every caller loads it
// through this one lazy wrapper instead of a static import. That keeps it out
// of the shared entry chunk every visitor downloads on every route, and lets
// it load as its own chunk in parallel exactly when a page needs it.
const BuilderCanvasContent = lazy(() =>
  import("@/components/builder/BuilderRenderer").then((module) => ({
    default: module.BuilderCanvasContent,
  })),
);

export function LazyBuilderCanvas({
  root,
  fallback = null,
}: {
  root: BuilderElement[];
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <BuilderCanvasContent root={root} />
    </Suspense>
  );
}
