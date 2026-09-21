import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ExternalLink,
  Eye,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { deleteWhatsappLead, listWhatsappLeads, updateWhatsappLead } from "@/lib/cms.functions";
import { supabase } from "@/integrations/supabase/client";
import { AdminModal } from "@/components/admin/AdminField";
import {
  AdminError,
  AdminLoading,
  AdminPage,
  EmptyState,
  Panel,
  PanelHeading,
  StatusPill,
  adminInput,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/whatsapp")({ component: WhatsappCrm });
type Lead = {
  id: string;
  name: string;
  phone: string;
  message: string;
  product_title: string;
  product_id: string | null;
  source: string;
  status: "pending" | "quoted" | "art_proof_sent" | "fulfilled";
  created_at: string;
};
const statuses: Lead["status"][] = ["pending", "quoted", "art_proof_sent", "fulfilled"];

function WhatsappCrm() {
  const list = useServerFn(listWhatsappLeads);
  const update = useServerFn(updateWhatsappLead);
  const remove = useServerFn(deleteWhatsappLead);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Lead["status"]>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const leads = useQuery({ queryKey: ["admin-whatsapp-leads"], queryFn: () => list({}) });
  useEffect(() => {
    const channel = supabase
      .channel("cms-whatsapp-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_leads" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead["status"] }) =>
      update({ data: { id, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] });
      toast.success("Lead status updated");
    },
    onError: () => toast.error("Could not update lead"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] });
      toast.success("Lead removed");
    },
    onError: () => toast.error("Could not remove lead"),
  });
  const rows = (leads.data ?? []) as Lead[];
  const filteredRows = rows.filter((row) => {
    const haystack = `${row.name} ${row.phone} ${row.product_title} ${row.message}`.toLowerCase();
    return (
      haystack.includes(query.trim().toLowerCase()) &&
      (statusFilter === "all" || row.status === statusFilter)
    );
  });
  const pending = rows.filter((row) => row.status === "pending").length;
  return (
    <AdminPage
      eyebrow="WhatsApp lead CRM"
      title="Turn conversations into orders."
      description="Every WhatsApp inquiry, product request, and follow-up status in one operational feed."
      action={
        <button
          type="button"
          onClick={() => leads.refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-xs font-semibold text-[#344054]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${leads.isFetching ? "animate-spin" : ""}`} /> Refresh
          feed
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Total inquiries" value={rows.length} />
        <Mini label="Needs response" value={pending} tone="amber" />
        <Mini
          label="Fulfilled"
          value={rows.filter((row) => row.status === "fulfilled").length}
          tone="green"
        />
      </div>
      <Panel>
        <PanelHeading
          icon={MessageCircle}
          title="Inbound quote feed"
          detail="Real-time from WhatsApp lead events"
          action={<StatusPill status="Live" />}
        />
        <div className="grid gap-3 border-b border-[#E2E7EF] p-4 md:grid-cols-[minmax(0,1fr)_180px]">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#CBD3DF] bg-white px-3 text-[#64748B]">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Search inquiries</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, product, or message…"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#172033] outline-none placeholder:text-[#64748B]"
            />
          </label>
          <label>
            <span className="sr-only">Filter inquiry status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className={adminInput}
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        {leads.isPending ? (
          <AdminLoading label="Loading WhatsApp inquiries" />
        ) : leads.isError ? (
          <AdminError
            detail="The WhatsApp inquiry feed could not be loaded."
            onRetry={() => void leads.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No WhatsApp inquiries yet"
            detail="When a customer starts an order conversation, it will appear here."
          />
        ) : (
          <div className="divide-y divide-[#EEF0F2]">
            {filteredRows.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                saving={statusMutation.isPending}
                onStatus={(status) => statusMutation.mutate({ id: lead.id, status })}
                onView={() => setSelectedLead(lead)}
                onDelete={() => setDeletingLead(lead)}
              />
            ))}
            {!filteredRows.length ? (
              <EmptyState
                title="No inquiries match"
                detail="Try a different search term or status filter."
              />
            ) : null}
          </div>
        )}
      </Panel>
      {selectedLead ? (
        <AdminModal
          title={selectedLead.name || "WhatsApp inquiry"}
          subtitle={`${selectedLead.product_title || "General quote"} · ${new Date(selectedLead.created_at).toLocaleString()}`}
          onClose={() => setSelectedLead(null)}
        >
          <div className="space-y-4 p-5 md:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-[#526079]">Phone</p>
                <p className="mt-1 text-sm text-[#172033]">{selectedLead.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#526079]">Status</p>
                <div className="mt-1">
                  <StatusPill status={selectedLead.status} />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#526079]">Message</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-[#F8FAFC] p-3 text-sm leading-6 text-[#172033]">
                {selectedLead.message || "No message captured."}
              </p>
            </div>
          </div>
        </AdminModal>
      ) : null}
      {deletingLead ? (
        <AdminModal
          title="Delete inquiry?"
          subtitle={`This will permanently remove ${deletingLead.name || "this inquiry"}.`}
          onClose={() => setDeletingLead(null)}
        >
          <div className="space-y-5 p-5 md:p-6">
            <p className="rounded-lg border border-[#FECACA] bg-[#FFF1F2] p-4 text-sm text-[#991B1B]">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingLead(null)}
                className="min-h-11 rounded-lg border border-[#CBD3DF] px-4 text-xs font-semibold text-[#172033]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(deletingLead.id);
                  setDeletingLead(null);
                }}
                className="min-h-11 rounded-lg bg-[#B42318] px-4 text-xs font-semibold text-white disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete inquiry"}
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}
    </AdminPage>
  );
}

function LeadRow({
  lead,
  saving,
  onView,
  onStatus,
  onDelete,
}: {
  lead: Lead;
  saving: boolean;
  onView: () => void;
  onStatus: (status: Lead["status"]) => void;
  onDelete: () => void;
}) {
  const responseHref = `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${lead.name || "there"}, thanks for reaching out to Triad Brands about ${lead.product_title || "your project"}. We are reviewing your request and will be back with a quote shortly.`)}`;
  return (
    <article className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(210px,1.2fr)_minmax(180px,1fr)_150px_160px_42px] lg:items-center lg:px-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF7EF] text-[#208454]">
          <UserRound className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{lead.name || "Unknown customer"}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#667085]">
            <Phone className="h-3 w-3" />
            {lead.phone}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#98A2B3]">
            {new Date(lead.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#344054]">
          {lead.product_title || "General quote"}
        </p>
        <p className="mt-1 truncate text-xs text-[#98A2B3]">
          {lead.message || "No message captured"}
        </p>
      </div>
      <StatusPill status={lead.status} />
      <select
        aria-label={`Status for ${lead.name}`}
        disabled={saving}
        value={lead.status}
        onChange={(event) => onStatus(event.target.value as Lead["status"])}
        className="rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#344054] outline-none focus:border-[#208454]"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1 lg:justify-end">
        <a
          href={responseHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Open WhatsApp reply"
          className="rounded-lg p-2 text-[#208454] hover:bg-[#EAF7EF]"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={onView}
          aria-label={`View inquiry from ${lead.name || "customer"}`}
          className="rounded-lg p-2 text-[#526079] hover:bg-[#F1F5F9] hover:text-[#172033]"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete lead"
          className="rounded-lg p-2 text-[#98A2B3] hover:bg-[#FDECEE] hover:text-[#C3121F]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function Mini({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "amber" | "green";
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${tone === "green" ? "border-[#B7E4C7] bg-[#EAF7EF]" : tone === "amber" ? "border-[#F4D58A] bg-[#FFF8E8]" : "border-[#E4E7EC] bg-white"}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#667085]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </article>
  );
}
