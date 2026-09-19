import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ImagePlus, Play, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteSiteAsset,
  deleteSlide,
  listSiteAssets,
  listSlides,
  replaceSiteAsset,
  uploadHeroSlideImage,
  uploadSiteAsset,
  upsertSlide,
} from "@/lib/cms.functions";
import { Panel, PanelHeading, StatusPill, adminInput } from "@/components/admin/ui";

export type HeroSlideDraft = {
  id?: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  cta_label: string;
  cta_href: string;
  image_url: string | null;
  overlay_opacity: number;
  active: boolean;
  sort_order: number;
};

type SiteAsset = {
  id: string;
  path: string;
  publicUrl: string;
  createdAt?: string | null;
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

const emptySlide = (sortOrder: number): HeroSlideDraft => ({
  eyebrow: "New slide",
  headline: "Add a headline",
  subtext: "Add supporting copy",
  cta_label: "Start a project",
  cta_href: "/contact",
  image_url: null,
  overlay_opacity: 60,
  active: true,
  sort_order: sortOrder,
});

export function CarouselStudio() {
  const queryClient = useQueryClient();
  const listSlidesFn = useServerFn(listSlides);
  const saveSlideFn = useServerFn(upsertSlide);
  const deleteSlideFn = useServerFn(deleteSlide);
  const uploadImageFn = useServerFn(uploadHeroSlideImage);
  const slidesQuery = useQuery({
    queryKey: ["structured-builder-slides"],
    queryFn: () => listSlidesFn({}),
  });
  const [drafts, setDrafts] = useState<Record<string, HeroSlideDraft>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const next = Object.fromEntries(
      ((slidesQuery.data ?? []) as HeroSlideDraft[]).map((slide, index) => [
        slide.id ?? `slide-${index}`,
        { ...slide },
      ]),
    );
    setDrafts(next);
  }, [slidesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (slide: HeroSlideDraft) => saveSlideFn({ data: slide as never }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["structured-builder-slides"] });
      toast.success("Slide saved");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save slide"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSlideFn({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["structured-builder-slides"] });
      toast.success("Slide deleted");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete slide"),
  });

  const updateSlide = (key: string, patch: Partial<HeroSlideDraft>) => {
    setDrafts((current) => ({ ...current, [key]: { ...current[key]!, ...patch } }));
  };
  const uploadSlideImage = async (key: string, file: File) => {
    setUploading(key);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadImageFn({
        data: { filename: file.name, contentType: file.type, base64 },
      });
      updateSlide(key, { image_url: result.publicUrl });
      toast.success("Slide image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image");
    } finally {
      setUploading(null);
    }
  };
  const addSlide = () => {
    const key = `new-${crypto.randomUUID()}`;
    setDrafts((current) => ({ ...current, [key]: emptySlide(Object.keys(current).length) }));
  };

  return (
    <Panel>
      <PanelHeading
        icon={Play}
        title="Carousel studio"
        detail="Create, arrange, image, and publish hero slides"
        action={
          <button
            type="button"
            onClick={addSlide}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0E1331] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#20284D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add slide
          </button>
        }
      />
      <div className="grid gap-4 p-5 md:p-6 xl:grid-cols-2">
        {slidesQuery.isPending ? <p className="text-sm text-[#667085]">Loading slides…</p> : null}
        {!slidesQuery.isPending && !Object.keys(drafts).length ? (
          <div className="rounded-2xl border border-dashed border-[#D0D5DD] px-5 py-10 text-center text-sm text-[#667085] xl:col-span-2">
            No slides yet. Add the first one to give the homepage a clear opening.
          </div>
        ) : null}
        {Object.entries(drafts).map(([key, slide], index) => (
          <article
            key={key}
            className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-[#FCFCFA]"
          >
            <div className="relative aspect-[16/7] overflow-hidden bg-[#101820]">
              {slide.image_url ? (
                <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-[#98A2B3]">
                  <ImagePlus className="h-7 w-7" aria-hidden="true" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">
                  {slide.eyebrow || "Untitled slide"}
                </p>
                <p className="mt-1 line-clamp-2 text-xl font-semibold">
                  {slide.headline || "Add a headline"}
                </p>
              </div>
              <label
                className="absolute right-3 top-3 grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-white/90 text-[#0E1331] hover:bg-white"
                aria-label={`Upload image for slide ${index + 1}`}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadSlideImage(key, file);
                  }}
                />
              </label>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <StatusPill status={slide.active ? "Active" : "Hidden"} />
                <label className="flex items-center gap-2 text-xs text-[#667085]">
                  <input
                    type="checkbox"
                    checked={slide.active}
                    onChange={(event) => updateSlide(key, { active: event.target.checked })}
                  />{" "}
                  Visible
                </label>
              </div>
              <input
                value={slide.eyebrow}
                onChange={(event) => updateSlide(key, { eyebrow: event.target.value })}
                aria-label={`Slide ${index + 1} eyebrow`}
                placeholder="Eyebrow"
                className={adminInput}
              />
              <input
                value={slide.headline}
                onChange={(event) => updateSlide(key, { headline: event.target.value })}
                aria-label={`Slide ${index + 1} headline`}
                placeholder="Headline"
                className={adminInput}
              />
              <textarea
                value={slide.subtext}
                onChange={(event) => updateSlide(key, { subtext: event.target.value })}
                aria-label={`Slide ${index + 1} supporting copy`}
                rows={2}
                placeholder="Supporting copy"
                className={`${adminInput} resize-y`}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={slide.cta_label}
                  onChange={(event) => updateSlide(key, { cta_label: event.target.value })}
                  aria-label={`Slide ${index + 1} button label`}
                  placeholder="Button label"
                  className={adminInput}
                />
                <input
                  value={slide.cta_href}
                  onChange={(event) => updateSlide(key, { cta_href: event.target.value })}
                  aria-label={`Slide ${index + 1} button link`}
                  placeholder="Button link"
                  className={adminInput}
                />
              </div>
              <label className="block text-xs font-semibold text-[#344054]">
                Order
                <input
                  type="number"
                  min="0"
                  value={slide.sort_order}
                  onChange={(event) => updateSlide(key, { sort_order: Number(event.target.value) })}
                  className={`${adminInput} mt-2`}
                />
              </label>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => saveMutation.mutate(slide)}
                  disabled={saveMutation.isPending || uploading === key}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#ED1D2B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#C81724] disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" /> Save slide
                </button>
                {slide.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this slide?")) deleteMutation.mutate(slide.id!);
                    }}
                    aria-label={`Delete slide ${index + 1}`}
                    className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-[#FDA29B] text-[#B42318] hover:bg-[#FFF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D92D20]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function AssetLibrary() {
  const queryClient = useQueryClient();
  const listAssetsFn = useServerFn(listSiteAssets);
  const uploadAssetFn = useServerFn(uploadSiteAsset);
  const replaceAssetFn = useServerFn(replaceSiteAsset);
  const deleteAssetFn = useServerFn(deleteSiteAsset);
  const assetsQuery = useQuery({
    queryKey: ["structured-builder-assets"],
    queryFn: () => listAssetsFn({}),
  });
  const [uploading, setUploading] = useState(false);
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file);
      return uploadAssetFn({
        data: { kind: "media", filename: file.name, contentType: file.type, base64 },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["structured-builder-assets"] });
      toast.success("Asset uploaded");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not upload asset"),
    onSettled: () => setUploading(false),
  });
  const deleteMutation = useMutation({
    mutationFn: (path: string) => deleteAssetFn({ data: { path } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["structured-builder-assets"] });
      toast.success("Asset deleted");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete asset"),
  });
  const replaceMutation = useMutation({
    mutationFn: async ({ path, file }: { path: string; file: File }) => {
      const base64 = await fileToBase64(file);
      return replaceAssetFn({ data: { path, contentType: file.type, base64 } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["structured-builder-assets"] });
      toast.success("Asset replaced");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not replace asset"),
  });
  const assets = (assetsQuery.data ?? []) as SiteAsset[];

  return (
    <Panel>
      <PanelHeading
        icon={ImagePlus}
        title="Asset library"
        detail="Upload and remove media used across the storefront"
        action={
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#0E1331] bg-white px-3.5 py-2 text-xs font-semibold text-[#0E1331] hover:bg-[#F8F9F6] focus-within:ring-2 focus-within:ring-[#ED1D2B]">
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />{" "}
            {uploading ? "Uploading…" : "Upload asset"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading || uploadMutation.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setUploading(true);
                  uploadMutation.mutate(file);
                }
              }}
            />
          </label>
        }
      />
      <div className="p-5 md:p-6">
        {assetsQuery.isPending ? <p className="text-sm text-[#667085]">Loading assets…</p> : null}
        {!assetsQuery.isPending && !assets.length ? (
          <p className="rounded-2xl border border-dashed border-[#D0D5DD] px-5 py-10 text-center text-sm text-[#667085]">
            Your media library is empty.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {assets.map((asset) => (
            <article
              key={asset.path}
              className="group overflow-hidden rounded-xl border border-[#EAECF0] bg-white"
            >
              <div className="aspect-square bg-[#F2F4F7]">
                <img
                  src={asset.publicUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <p
                  className="min-w-0 truncate text-[11px] font-medium text-[#344054]"
                  title={asset.path}
                >
                  {asset.path.split("/").pop()}
                </p>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <label
                    className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] focus-within:ring-2 focus-within:ring-[#0E1331]"
                    aria-label={`Replace ${asset.path.split("/").pop()}`}
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={replaceMutation.isPending}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) replaceMutation.mutate({ path: asset.path, file });
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this asset?")) deleteMutation.mutate(asset.path);
                    }}
                    aria-label={`Delete ${asset.path.split("/").pop()}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-[#98A2B3] hover:bg-[#FFF5F5] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D92D20]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}
