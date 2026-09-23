import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { deleteProject, listAllProjects, upsertProject, uploadAsset } from "@/lib/admin.functions";
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
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/work")({ component: WorkAdmin });

type Row = {
  id?: string;
  slug: string;
  title: string;
  label: string;
  category: string;
  meta: string;
  year: string;
  client: string;
  services: string[];
  summary: string;
  body: string[];
  image_url: string | null;
  sort_order: number;
  published: boolean;
};

const blank: Row = {
  slug: "",
  title: "",
  label: "",
  category: "Branding",
  meta: "",
  year: "",
  client: "",
  services: [],
  summary: "",
  body: [],
  image_url: null,
  sort_order: 0,
  published: true,
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function WorkAdmin() {
  const list = useServerFn(listAllProjects);
  const save = useServerFn(upsertProject);
  const remove = useServerFn(deleteProject);
  const upload = useServerFn(uploadAsset);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => list({}),
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-projects-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-projects"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const mutate = useMutation({
    mutationFn: (row: Row) => save({ data: row as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      setDraft(null);
      toast.success("Project saved");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save project"),
  });
  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Project deleted");
    },
    onError: () => toast.error("Could not delete project"),
  });

  async function uploadImage(file: File) {
    setUploading(true);
    const toastId = toast.loading("Uploading image…");
    try {
      const base64 = await fileToBase64(file);
      const { publicUrl } = await upload({
        data: { folder: "media", filename: file.name, contentType: file.type, base64 },
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

  const rows = (data ?? []) as Row[];

  return (
    <AdminPage
      eyebrow="Portfolio"
      title="Make the work do the talking."
      description="Case studies shown on the public portfolio, ordered and ready to send."
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New project
        </button>
      }
    >
      <Panel>
        <PanelHeading
          icon={Briefcase}
          title="Portfolio library"
          detail={`${rows.length} case studies`}
          action={<StatusPill status="Realtime connected" />}
        />
        <div className="space-y-3 p-4 md:p-6">
          {isPending ? (
            <AdminLoading label="Loading portfolio" />
          ) : isError ? (
            <AdminError
              detail="The portfolio could not be loaded."
              onRetry={() => void refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No projects yet"
              detail="Add a case study to give the portfolio a stronger point of view."
            />
          ) : (
            rows.map((r) => (
              <article
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111827]">
                    {r.title || "Untitled project"}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {r.category} · {r.year || "No year"} · {r.client || "No client"}
                  </p>
                  <div className="mt-2">
                    <StatusPill status={r.published ? "Published" : "Draft"} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...r })}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#E5E7EB] px-3 text-xs font-semibold text-[#111827] hover:border-[#ED1D2B] hover:text-[#ED1D2B]"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(r)}
                    className="grid min-h-10 min-w-10 place-items-center rounded-xl text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                    aria-label={`Delete ${r.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </Panel>

      {draft ? (
        <Modal
          title={draft.id ? "Edit project" : "New project"}
          subtitle="Manage the work detail shown on the public portfolio."
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
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </Field>
              <Field label="Slug">
                <input
                  className={inputClass}
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
              </Field>
              <Field label="Category">
                <select
                  className={inputClass}
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {["Branding", "Digital", "Print"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Label">
                <input
                  className={inputClass}
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                />
              </Field>
              <Field label="Year">
                <input
                  className={inputClass}
                  value={draft.year}
                  onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                />
              </Field>
              <Field label="Client">
                <input
                  className={inputClass}
                  value={draft.client}
                  onChange={(e) => setDraft({ ...draft, client: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Services (comma separated)">
              <input
                className={inputClass}
                value={draft.services.join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    services: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Summary">
              <textarea
                className={`${inputClass} min-h-20 resize-y`}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              />
            </Field>
            <Field label="Body (one paragraph per line)">
              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={draft.body.join("\n")}
                onChange={(e) =>
                  setDraft({ ...draft, body: e.target.value.split("\n").filter((p) => p.trim()) })
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />
              Published
            </label>
          </div>
          <ModalFooter
            onCancel={() => setDraft(null)}
            onSave={() => mutate.mutate(draft)}
            saving={mutate.isPending}
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
          title="Delete project?"
          subtitle={`This will remove ${deleting.title || "this project"} from the portfolio.`}
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
