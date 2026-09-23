import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImageIcon, Upload } from "lucide-react";

import { Modal } from "@/components/admin/ui";
import { listAssets } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

/**
 * Browse previously uploaded images instead of re-uploading the same file.
 * Reads the same `site-assets` bucket every other admin screen writes to.
 */
export function AssetPicker({
  onPick,
  onClose,
  onUpload,
}: {
  onPick: (url: string) => void;
  onClose: () => void;
  onUpload?: (file: File) => Promise<string>;
}) {
  const list = useServerFn(listAssets);
  const [folder, setFolder] = useState<"media" | "products" | "hero-slides" | "branding">("media");
  const [busy, setBusy] = useState(false);

  const assets = useQuery({
    queryKey: ["assets", folder],
    queryFn: () => list({ data: { folder } }),
  });

  const folders = [
    { id: "media", label: "Media" },
    { id: "products", label: "Products" },
    { id: "hero-slides", label: "Hero" },
    { id: "branding", label: "Branding" },
  ] as const;

  return (
    <Modal title="Media library" subtitle="Pick an image or upload a new one" onClose={onClose}>
      <div className="p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {folders.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setFolder(entry.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                folder === entry.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
          {onUpload ? (
            <label
              className={cn(
                "ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs",
                busy && "pointer-events-none opacity-60",
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              {busy ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  try {
                    onPick(await onUpload(file));
                    onClose();
                  } finally {
                    setBusy(false);
                    event.target.value = "";
                  }
                }}
              />
            </label>
          ) : null}
        </div>

        <div className="max-h-[24rem] overflow-y-auto">
          {assets.isPending ? (
            <p className="text-sm text-muted-foreground">Loading library…</p>
          ) : assets.isError ? (
            <p className="text-sm text-destructive">{(assets.error as Error).message}</p>
          ) : !assets.data?.length ? (
            <div className="grid place-items-center gap-2 py-12 text-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nothing in this folder yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {assets.data.map((asset) => (
                <button
                  key={asset.path}
                  type="button"
                  onClick={() => {
                    onPick(asset.url);
                    onClose();
                  }}
                  className="group overflow-hidden rounded-lg border border-border transition-colors hover:border-accent"
                  title={asset.name}
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
