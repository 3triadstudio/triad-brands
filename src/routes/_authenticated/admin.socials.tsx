import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteSocial, listAllSocials, upsertSocial } from "@/lib/admin.functions";
import { AdminModal, Field, RowActions, inputClass } from "@/components/admin/AdminField";
import { AdminPage, EmptyState, Panel, PanelHeading, StatusPill } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/socials")({
  component: SocialsAdmin,
});

interface Row {
  id?: string;
  label: string;
  href: string;
  icon_key: string;
  sort_order: number;
  active: boolean;
}

const blank: Row = { label: "", href: "", icon_key: "globe", sort_order: 0, active: true };

function SocialsAdmin() {
  const list = useServerFn(listAllSocials);
  const save = useServerFn(upsertSocial);
  const remove = useServerFn(deleteSocial);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const { data, isPending } = useQuery({ queryKey: ["admin-socials"], queryFn: () => list({}) });

  const mutate = useMutation({
    mutationFn: (row: Row) =>
      save({ data: { ...row, sort_order: Number(row.sort_order) || 0 } as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-socials"] });
      setDraft(null);
      toast.success("Link saved");
    },
    onError: () => toast.error("Could not save link"),
  });

  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-socials"] });
      toast.success("Link deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Could not delete link"),
  });

  if (isPending) return <p className="text-sm text-[#94A3B8]">Loading links…</p>;
  const rows = (data ?? []) as Row[];

  return (
    <AdminPage
      eyebrow="Social distribution"
      title="Keep every public doorway current."
      description="Manage the links that connect the studio to its wider network, with clear visibility and order."
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-4 py-3 text-xs font-semibold text-[#0F1217]"
        >
          <Plus className="h-3.5 w-3.5" /> New link
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Total links" value={rows.length} />
        <Mini label="Active" value={rows.filter((row) => row.active).length} tone="green" />
        <Mini label="Hidden" value={rows.filter((row) => !row.active).length} tone="amber" />
      </div>
      <Panel>
        <PanelHeading
          icon={Link2}
          title="Social link registry"
          detail={`${rows.length} destinations · footer and social surfaces`}
          action={<StatusPill status="Public links" />}
        />
        <div className="space-y-4 p-4 md:p-6">
          {draft && (
            <AdminModal
              title={draft.id ? "Edit social link" : "New social link"}
              subtitle="Manage a link displayed in the public footer."
              onClose={() => setDraft(null)}
            >
              <SocialForm
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
                <p className="font-medium">{r.label || "Untitled link"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.href || "No URL"} · {r.active ? "Active" : "Inactive"}
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
              title="No social links yet"
              detail="Add Instagram, LinkedIn, or another public channel to make the footer work harder."
            />
          ) : null}
          {deleting && (
            <AdminModal
              title="Delete social link?"
              subtitle={`This will remove ${deleting.label || "this link"} from the public footer.`}
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

function SocialForm({
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
    <article className="grid gap-4 rounded-[var(--radius)] border border-border p-6 md:grid-cols-4">
      <Field label="Label">
        <input
          className={inputClass}
          value={v.label}
          onChange={(e) => set("label", e.target.value)}
        />
      </Field>
      <Field label="URL">
        <input
          className={inputClass}
          value={v.href}
          onChange={(e) => set("href", e.target.value)}
        />
      </Field>
      <Field label="Icon key">
        <input
          className={inputClass}
          value={v.icon_key}
          placeholder="instagram"
          onChange={(e) => set("icon_key", e.target.value)}
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
      <div className="flex items-end justify-between gap-3">
        <label className="label-mono flex items-center gap-2 pb-3">
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
