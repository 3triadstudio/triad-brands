import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { deleteService, listAllServices, upsertService } from "@/lib/admin.functions";
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

export const Route = createFileRoute("/_authenticated/admin/services")({
  component: ServicesAdmin,
});

interface Row {
  id?: string;
  tag: string;
  name: string;
  detail: string;
  deliverables: string[];
  sort_order: number;
  active: boolean;
}

const blank: Row = { tag: "", name: "", detail: "", deliverables: [], sort_order: 0, active: true };

function ServicesAdmin() {
  const list = useServerFn(listAllServices);
  const save = useServerFn(upsertService);
  const remove = useServerFn(deleteService);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => list({}),
  });

  const mutate = useMutation({
    mutationFn: (row: Row) =>
      save({ data: { ...row, sort_order: Number(row.sort_order) || 0 } as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      setDraft(null);
      toast.success("Service saved");
    },
    onError: () => toast.error("Could not save service"),
  });

  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      toast.success("Service deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Could not delete service"),
  });

  if (isPending) return <AdminLoading label="Loading services" />;
  if (isError) {
    return <AdminError detail="Services could not be loaded." onRetry={() => void refetch()} />;
  }
  const rows = (data ?? []) as Row[];

  return (
    <AdminPage
      eyebrow="Offer architecture"
      title="Make the service menu unmistakable."
      description="Clarify what Triad does, how it helps, and what a customer can expect to receive."
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-4 py-3 text-xs font-semibold text-[#0F1217]"
        >
          <Plus className="h-3.5 w-3.5" /> New service
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Total services" value={rows.length} />
        <Mini label="Active" value={rows.filter((row) => row.active).length} tone="green" />
        <Mini label="Hidden" value={rows.filter((row) => !row.active).length} tone="amber" />
      </div>
      <Panel>
        <PanelHeading
          icon={Wrench}
          title="Service library"
          detail={`${rows.length} offerings · ordered by sort value`}
          action={<StatusPill status="Public content" />}
        />
        <div className="space-y-4 p-4 md:p-6">
          {draft && (
            <AdminModal
              title={draft.id ? "Edit service" : "New service"}
              subtitle="Define the service details shown on the public site."
              onClose={() => setDraft(null)}
            >
              <ServiceForm
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
                <p className="font-medium">{r.name || "Untitled service"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.tag || "No tag"} · {r.active ? "Active" : "Inactive"}
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
              title="No services yet"
              detail="Add the capabilities customers should see when they visit the studio."
            />
          ) : null}
          {deleting && (
            <AdminModal
              title="Delete service?"
              subtitle={`This will remove ${deleting.name || "this service"} from the public site.`}
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

function ServiceForm({
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
        <Field label="Name">
          <input
            className={inputClass}
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Tag">
          <input
            className={inputClass}
            value={v.tag}
            onChange={(e) => set("tag", e.target.value)}
          />
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            className={inputClass}
            value={v.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Detail">
        <textarea
          rows={3}
          className={inputClass}
          value={v.detail}
          onChange={(e) => set("detail", e.target.value)}
        />
      </Field>
      <Field label="Deliverables (comma separated)">
        <input
          className={inputClass}
          value={(v.deliverables ?? []).join(", ")}
          onChange={(e) =>
            set(
              "deliverables",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="label-mono flex items-center gap-2">
          <input
            type="checkbox"
            checked={v.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Active
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
