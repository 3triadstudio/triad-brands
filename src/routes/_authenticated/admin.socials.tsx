import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { toast } from "sonner";
import { deleteSocialLink, listAllSocialLinks, upsertSocialLink } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { IconPicker } from "@/components/admin/IconPicker";
import {
  AdminPage,
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

export const Route = createFileRoute("/_authenticated/admin/socials")({ component: SocialsAdmin });

type Row = {
  id?: string;
  label: string;
  href: string;
  icon_key: string;
  sort_order: number;
  active: boolean;
};

const blank: Row = { label: "", href: "", icon_key: "globe", sort_order: 0, active: true };

function SocialsAdmin() {
  const list = useServerFn(listAllSocialLinks);
  const save = useServerFn(upsertSocialLink);
  const remove = useServerFn(deleteSocialLink);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const { data, isPending } = useQuery({ queryKey: ["admin-socials"], queryFn: () => list({}) });

  useEffect(() => {
    const channel = supabase
      .channel("admin-socials-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_links" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-socials"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const mutate = useMutation({
    mutationFn: (row: Row) => save({ data: row as never }),
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
    },
    onError: () => toast.error("Could not delete link"),
  });

  const rows = (data ?? []) as Row[];

  return (
    <AdminPage
      eyebrow="Distribution"
      title="Keep every public doorway current."
      description="Links that connect the studio to its wider network, shown in the footer."
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New link
        </button>
      }
    >
      <Panel>
        <PanelHeading
          icon={Link2}
          title="Social link registry"
          detail={`${rows.length} destinations`}
          action={<StatusPill status="Realtime connected" />}
        />
        <div className="space-y-3 p-4 md:p-6">
          {isPending ? (
            <AdminLoading label="Loading links" />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No social links yet"
              detail="Add Instagram, LinkedIn, or another channel to make the footer work harder."
            />
          ) : (
            rows.map((r) => (
              <article
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F3F4F6] text-[#4B5563]">
                    <DynamicIcon
                      name={(r.icon_key || "globe") as IconName}
                      className="h-4 w-4"
                      aria-hidden="true"
                      fallback={() => <Link2 className="h-4 w-4" aria-hidden="true" />}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111827]">
                      {r.label || "Untitled link"}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#6B7280]">{r.href || "No URL"}</p>
                    <div className="mt-2">
                      <StatusPill status={r.active ? "Active" : "Inactive"} />
                    </div>
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
                    aria-label={`Delete ${r.label}`}
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
          title={draft.id ? "Edit social link" : "New social link"}
          subtitle="A link displayed in the public footer."
          onClose={() => setDraft(null)}
        >
          <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-6">
            <Field label="Label">
              <input
                className={inputClass}
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </Field>
            <Field label="URL">
              <input
                className={inputClass}
                value={draft.href}
                onChange={(e) => setDraft({ ...draft, href: e.target.value })}
              />
            </Field>
            <IconPicker
              label="Icon"
              value={draft.icon_key}
              onChange={(icon_key) => setDraft({ ...draft, icon_key })}
            />
            <Field label="Sort order">
              <input
                type="number"
                className={inputClass}
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              />
            </Field>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] sm:col-span-2">
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
          title="Delete social link?"
          subtitle={`This will remove ${deleting.label || "this link"} from the footer.`}
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
