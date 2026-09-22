import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart({ server: { entry: "server" } }),
    react(),
  ],
  build: {
    // The shared entry chunk (React, TanStack Router's own route manifest,
    // TanStack Query, Radix UI, Sonner) sits around 600 kB — genuine
    // first-party UI dependencies used across the whole app, not slack. The
    // real waste here was `import * as Lucide from "lucide-react"` pulling in
    // the entire ~1000-icon package for a handful of named lookups, and the
    // builder's page/region renderer being statically imported into every
    // public route instead of code-split; both are fixed (see
    // src/lib/builder/icons.ts and src/components/builder/LazyBuilderCanvas.tsx).
    // This raises the warning threshold to match the bundle's real,
    // now-justified floor instead of masking future regressions with a huge
    // limit.
    chunkSizeWarningLimit: 650,
  },
});
