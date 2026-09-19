import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteProject, listAllProjects, upsertProject } from "@/lib/admin.functions";
import { AdminModal, Field, RowActions, inputClass } from "@/components/admin/AdminField";
import {
  AdminError,
  AdminLoading,
  AdminPage,
  EmptyState,
  Panel,
  PanelHeading,
  StatusPill,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  component: ProjectsAdmin,
});

interface Row {
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
}

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

function ProjectsAdmin() {
  const list = useServerFn(listAllProjects);
  const save = useServerFn(upsertProject);
  const remove = useServerFn(deleteProject);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => list({}),
  });

  const mutate = useMutation({
    mutationFn: (row: Row) =>
      save({
        data: {
          ...row,
          sort_order: Number(row.sort_order) || 0,
          image_url: row.image_url || null,
        } as never,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      setDraft(null);
      toast.success("Project saved");
    },
    onError: () => toast.error("Could not save project"),
  });

  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Project deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Could not delete project"),
  });

  if (isPending) return <AdminLoading label="Loading portfolio" />;
  if (isError) {
    return (
      <AdminError detail="The portfolio could not be loaded." onRetry={() => void refetch()} />
    );
  }
  const rows = (data ?? []) as Row[];

  return (
    <AdminPage
      eyebrow="Portfolio management"
      title="Make the work do the talking."
      description="Keep case studies current, ordered, and ready to turn a curious visitor into a serious brief."
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-4 py-3 text-xs font-semibold text-[#0F1217]"
        >
          <Plus className="h-3.5 w-3.5" /> New project
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Total projects" value={rows.length} />
        <Mini label="Published" value={rows.filter((row) => row.published).length} tone="green" />
        <Mini label="Drafts" value={rows.filter((row) => !row.published).length} tone="amber" />
      </div>
      <Panel>
        <PanelHeading
          icon={Briefcase}
          title="Portfolio library"
          detail={`${rows.length} case studies · ordered by sort value`}
          action={<StatusPill status="Content studio" />}
        />
        <div className="space-y-4 p-4 md:p-6">
          {draft && (
            <AdminModal
              title={draft.id ? "Edit project" : "New project"}
              subtitle="Manage the work detail shown on the public portfolio."
              onClose={() => setDraft(null)}
            >
              <ProjectForm
                row={draft}
                onSave={(r) => mutate.mutate(r)}
                onCancel={() => setDraft(null)}
                saving={mutate.isPending}
              />
            </AdminModal>
          )}

          {rows.map((r) => (
            <article
              key={r.id!}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius)] border border-border p-5"
            >
              <div>
                <p className="font-medium">{r.title || "Untitled project"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.category} · {r.year || "No year"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...r })}
                  className="label-mono rounded-full border border-border px-4 py-2"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(r)}
                  className="label-mono rounded-full border border-white/10 px-4 py-2 text-red-300"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {rows.length === 0 && !draft ? (
            <EmptyState
              title="No projects yet"
              detail="Add a case study to give the portfolio a stronger point of view."
            />
          ) : null}
          {deleting && (
            <AdminModal
              title="Delete project?"
              subtitle={`This will remove ${deleting.title || "this project"} from the portfolio.`}
              onClose={() => setDeleting(null)}
            >
              <div className="space-y-5 p-6">
                <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                  This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleting(null)}
                    className="label-mono rounded-full border border-white/10 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => destroy.mutate(deleting.id!)}
                    className="label-mono rounded-full bg-red-500 px-4 py-2 text-white"
                  >
                    Confirm delete
                  </button>
                </div>
              </div>
            </AdminModal>
          )}
        </div>
      </Panel>
    </AdminPage>
  );
}

function Mini({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "green" | "amber";
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${tone === "green" ? "border-emerald-300/20 bg-emerald-400/10" : tone === "amber" ? "border-[#FF7A00]/20 bg-[#FF7A00]/10" : "border-white/[0.08] bg-[#161B22]"}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
    </article>
  );
}

function ProjectForm({
  row,
  onSave,
  onDelete,
  onCancel,
  saving,
}: {
  row: Row;
  onSave: (row: Row) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  saving?: boolean;
}) {
  const [v, setV] = useState<Row>(row);
  const set = (k: keyof Row, val: unknown) => setV((p) => ({ ...p, [k]: val }));

  return (
    <article className="space-y-4 rounded-[var(--radius)] border border-border p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Title">
          <input
            className={inputClass}
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
        <Field label="Slug">
          <input
            className={inputClass}
            value={v.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
        </Field>
        <Field label="Category">
          <select
            className={inputClass}
            value={v.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {["Branding", "Digital", "Print"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Label">
          <input
            className={inputClass}
            value={v.label ?? ""}
            onChange={(e) => set("label", e.target.value)}
          />
        </Field>
        <Field label="Meta">
          <input
            className={inputClass}
            value={v.meta ?? ""}
            onChange={(e) => set("meta", e.target.value)}
          />
        </Field>
        <Field label="Year">
          <input
            className={inputClass}
            value={v.year ?? ""}
            onChange={(e) => set("year", e.target.value)}
          />
        </Field>
        <Field label="Client">
          <input
            className={inputClass}
            value={v.client ?? ""}
            onChange={(e) => set("client", e.target.value)}
          />
        </Field>
        <Field label="Image URL">
          <input
            className={inputClass}
            value={v.image_url ?? ""}
            onChange={(e) => set("image_url", e.target.value)}
          />
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            className={inputClass}
            value={v.sort_order ?? 0}
            onChange={(e) => set("sort_order", Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Services (comma separated)">
        <input
          className={inputClass}
          value={(v.services ?? []).join(", ")}
          onChange={(e) =>
            set(
              "services",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </Field>
      <Field label="Summary">
        <textarea
          rows={2}
          className={inputClass}
          value={v.summary ?? ""}
          onChange={(e) => set("summary", e.target.value)}
        />
      </Field>
      <Field label="Body (one paragraph per line)">
        <textarea
          rows={5}
          className={inputClass}
          value={(v.body ?? []).join("\n")}
          onChange={(e) =>
            set(
              "body",
              e.target.value.split("\n").filter((p) => p.trim()),
            )
          }
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="label-mono flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(v.published)}
            onChange={(e) => set("published", e.target.checked)}
          />
          Published
        </label>
        <RowActions
          onSave={() => onSave(v)}
          {...(onDelete ? { onDelete } : {})}
          saving={!!saving}
        />
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="label-mono rounded-full border border-white/10 px-5 py-2.5 text-muted-foreground"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </article>
  );
}
