import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Image as ImageIcon, ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteHeroSlide,
  listHeroSlides,
  upsertHeroSlide,
  uploadAsset,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPage,
  AdminError,
  AdminLoading,
  EmptyState,
  Field,
  Modal,
  ModalFooter,
  Panel,
  PanelHeading,
  StatusPill,
  Toggle,
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/hero")({ component: HeroStudio });

type Slide = {
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

const blank = (sortOrder: number): Slide => ({
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

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function HeroStudio() {
  const list = useServerFn(listHeroSlides);
  const save = useServerFn(upsertHeroSlide);
  const remove = useServerFn(deleteHeroSlide);
  const upload = useServerFn(uploadAsset);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Slide | null>(null);
  const [deleting, setDeleting] = useState<Slide | null>(null);
  const [uploading, setUploading] = useState(false);

  const slides = useQuery({ queryKey: ["admin-hero-slides"], queryFn: () => list({}) });

  useEffect(() => {
    const channel = supabase
      .channel("admin-hero-slides-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_slides" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-hero-slides"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const mutation = useMutation({
    mutationFn: (slide: Slide) => save({ data: slide as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      setDraft(null);
      toast.success("Slide saved");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save slide"),
  });
  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      toast.success("Slide deleted");
    },
    onError: () => toast.error("Could not delete slide"),
  });

  const rows = (slides.data ?? []) as Slide[];

  async function uploadImage(file: File) {
    setUploading(true);
    const toastId = toast.loading("Uploading image…");
    try {
      const base64 = await fileToBase64(file);
      const { publicUrl } = await upload({
        data: { folder: "hero-slides", filename: file.name, contentType: file.type, base64 },
      });
      setDraft((c) => (c ? { ...c, image_url: publicUrl } : c));
      toast.success("Image uploaded", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image", {
        id: toastId,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminPage
      eyebrow="Homepage"
      title="Hero carousel"
      description="The rotating headline slides customers see first on the homepage."
      action={
        <button
          type="button"
          onClick={() => setDraft(blank(rows.length))}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add slide
        </button>
      }
    >
      <Panel>
        <PanelHeading
          icon={ImageIcon}
          title="Slides"
          detail={`${rows.length} configured · ${rows.filter((r) => r.active).length} live`}
          action={<StatusPill status="Realtime connected" />}
        />
        {slides.isPending ? (
          <AdminLoading label="Loading slides" />
        ) : slides.isError ? (
          <AdminError detail="Slides could not be loaded." onRetry={() => void slides.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No slides yet"
            detail="Add the first slide to give the homepage a clear opening."
          />
        ) : (
          <div className="grid gap-4 p-5 md:p-6 xl:grid-cols-2">
            {rows.map((slide) => (
              <article
                key={slide.id}
                className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white"
              >
                <div className="relative aspect-[16/7] overflow-hidden bg-[#111827]">
                  {slide.image_url ? (
                    <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-white/40">
                      <ImagePlus className="h-7 w-7" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-4 bottom-3 text-white">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">
                      {slide.eyebrow}
                    </p>
                    <p className="mt-1 line-clamp-2 text-lg font-semibold">{slide.headline}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <StatusPill status={slide.active ? "Active" : "Hidden"} />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDraft(slide)}
                      className="min-h-9 rounded-lg border border-[#E5E7EB] px-3 text-[10px] font-semibold text-[#111827] hover:border-[#ED1D2B] hover:text-[#ED1D2B]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(slide)}
                      className="rounded-lg p-2 text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                      aria-label="Delete slide"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {draft ? (
        <Modal
          title={draft.id ? "Edit slide" : "New slide"}
          subtitle="Headline, image, and call to action."
          onClose={() => setDraft(null)}
        >
          <div className="space-y-4 p-5 md:p-6">
            <label className="block cursor-pointer rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-4 text-center hover:border-[#ED1D2B]">
              {draft.image_url ? (
                <img
                  src={draft.image_url}
                  alt=""
                  className="mx-auto mb-2 max-h-32 rounded-lg object-cover"
                />
              ) : null}
              <Upload className="mx-auto h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
              <p className="mt-1.5 text-xs font-semibold text-[#111827]">
                {uploading ? "Uploading…" : draft.image_url ? "Replace image" : "Upload image"}
              </p>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                }}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Eyebrow">
                <input
                  value={draft.eyebrow}
                  onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Sort order">
                <input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Headline">
              <input
                value={draft.headline}
                onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Supporting copy">
              <textarea
                value={draft.subtext}
                onChange={(e) => setDraft({ ...draft, subtext: e.target.value })}
                className={`${inputClass} min-h-20 resize-y`}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button label">
                <input
                  value={draft.cta_label}
                  onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Button link">
                <input
                  value={draft.cta_href}
                  onChange={(e) => setDraft({ ...draft, cta_href: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              Visible
              <Toggle
                checked={draft.active}
                onChange={(v) => setDraft({ ...draft, active: v })}
                label="Slide visible"
              />
            </label>
          </div>
          <ModalFooter
            onCancel={() => setDraft(null)}
            onSave={() => mutation.mutate(draft)}
            saving={mutation.isPending}
            {...(draft.id
              ? {
                  onDelete: () => {
                    setDeleting(draft);
                    setDraft(null);
                  },
                }
              : {})}
          />
        </Modal>
      ) : null}

      {deleting ? (
        <Modal
          title="Delete slide?"
          subtitle="This will remove it from the homepage."
          onClose={() => setDeleting(null)}
        >
          <div className="p-5 md:p-6">
            <p className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#F3F4F6] p-5 md:p-6">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="min-h-10 rounded-xl border border-[#E5E7EB] px-4 text-xs font-semibold text-[#111827] hover:bg-[#F9FAFB]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleting.id) destroy.mutate(deleting.id);
                setDeleting(null);
              }}
              className="min-h-10 rounded-xl bg-[#991B1B] px-4 text-xs font-semibold text-white hover:bg-[#7F1D1D]"
            >
              Confirm delete
            </button>
          </div>
        </Modal>
      ) : null}
    </AdminPage>
  );
}
