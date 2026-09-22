import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { deleteService, listAllServices, upsertService } from "@/lib/admin.functions";
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

export const Route = createFileRoute("/_authenticated/admin/services")({
  component: ServicesAdmin,
});

type Row = {
  id?: string;
  tag: string;
  name: string;
  detail: string;
  deliverables: string[];
  sort_order: number;
  active: boolean;
};

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

  useEffect(() => {
    const channel = supabase
      .channel("admin-services-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-services"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const mutate = useMutation({
    mutationFn: (row: Row) => save({ data: row as never }),
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
    },
    onError: () => toast.error("Could not delete service"),
  });

  const rows = (data ?? []) as Row[];

  return (
    <AdminPage
      eyebrow="Offer architecture"
      title="Make the service menu unmistakable."
      description="What Triad does, how it helps, and what a customer can expect to receive."
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New service
        </button>
      }
    >
      <Panel>
        <PanelHeading
          icon={Wrench}
          title="Service library"
          detail={`${rows.length} offerings`}
          action={<StatusPill status="Realtime connected" />}
        />
        <div className="space-y-3 p-4 md:p-6">
          {isPending ? (
            <AdminLoading label="Loading services" />
          ) : isError ? (
            <AdminError detail="Services could not be loaded." onRetry={() => void refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No services yet"
              detail="Add the capabilities customers should see when they visit the site."
            />
          ) : (
            rows.map((r) => (
              <article
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111827]">
                    {r.name || "Untitled service"}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">{r.tag || "No tag"}</p>
                  <div className="mt-2">
                    <StatusPill status={r.active ? "Active" : "Inactive"} />
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
                    aria-label={`Delete ${r.name}`}
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
          title={draft.id ? "Edit service" : "New service"}
          subtitle="Define the service details shown on the public site."
          onClose={() => setDraft(null)}
        >
          <div className="space-y-4 p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Name">
                <input
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Tag">
                <input
                  className={inputClass}
                  value={draft.tag}
                  onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                />
              </Field>
              <Field label="Sort order">
                <input
                  type="number"
                  className={inputClass}
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="Detail">
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={draft.detail}
                onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
              />
            </Field>
            <Field label="Deliverables (comma separated)">
              <input
                className={inputClass}
                value={draft.deliverables.join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deliverables: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Active
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
          title="Delete service?"
          subtitle={`This will remove ${deleting.name || "this service"} from the public site.`}
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
