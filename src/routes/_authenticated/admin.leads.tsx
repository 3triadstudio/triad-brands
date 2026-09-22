import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Mail, MessageCircle, Phone, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteLead,
  deleteWhatsappLead,
  listLeads,
  listWhatsappLeads,
  updateLead,
  updateWhatsappLead,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminError,
  AdminLoading,
  AdminPage,
  EmptyState,
  Panel,
  PanelHeading,
  StatusPill,
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/leads")({ component: LeadsInbox });

type FormLead = {
  id: string;
  name: string;
  company: string | null;
  service: string | null;
  email: string;
  status: "new" | "in_review" | "won" | "archived";
  created_at: string;
};
type WhatsappLead = {
  id: string;
  name: string;
  phone: string;
  message: string;
  product_title: string;
  status: "pending" | "quoted" | "art_proof_sent" | "fulfilled";
  created_at: string;
};

const formStatuses: FormLead["status"][] = ["new", "in_review", "won", "archived"];
const waStatuses: WhatsappLead["status"][] = ["pending", "quoted", "art_proof_sent", "fulfilled"];

function LeadsInbox() {
  const [tab, setTab] = useState<"whatsapp" | "form">("whatsapp");
  const [query, setQuery] = useState("");
  const qc = useQueryClient();

  const listFormFn = useServerFn(listLeads);
  const updateFormFn = useServerFn(updateLead);
  const deleteFormFn = useServerFn(deleteLead);
  const listWaFn = useServerFn(listWhatsappLeads);
  const updateWaFn = useServerFn(updateWhatsappLead);
  const deleteWaFn = useServerFn(deleteWhatsappLead);

  const formLeads = useQuery({ queryKey: ["admin-form-leads"], queryFn: () => listFormFn({}) });
  const waLeads = useQuery({ queryKey: ["admin-whatsapp-leads"], queryFn: () => listWaFn({}) });

  useEffect(() => {
    const channel = supabase
      .channel("admin-leads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-form-leads"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_leads" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const formStatusMutation = useMutation({
    mutationFn: (input: { id: string; status: FormLead["status"] }) =>
      updateFormFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-form-leads"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Could not update status"),
  });
  const formDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteFormFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-form-leads"] });
      toast.success("Lead removed");
    },
    onError: () => toast.error("Could not remove lead"),
  });
  const waStatusMutation = useMutation({
    mutationFn: (input: { id: string; status: WhatsappLead["status"] }) =>
      updateWaFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Could not update status"),
  });
  const waDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteWaFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] });
      toast.success("Lead removed");
    },
    onError: () => toast.error("Could not remove lead"),
  });

  const formRows = (formLeads.data ?? []) as FormLead[];
  const waRows = (waLeads.data ?? []) as WhatsappLead[];
  const pendingWa = waRows.filter((r) => r.status === "pending").length;

  const filteredForm = formRows.filter((r) =>
    `${r.name} ${r.email} ${r.company ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );
  const filteredWa = waRows.filter((r) =>
    `${r.name} ${r.phone} ${r.product_title}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AdminPage
      eyebrow="Leads"
      title="Turn conversations into orders."
      description="Every WhatsApp inquiry and website form submission in one operational feed."
      action={<StatusPill status={`${pendingWa} pending`} />}
    >
      <Panel>
        <PanelHeading
          icon={MessageCircle}
          title="Lead inbox"
          detail={`${formRows.length + waRows.length} total enquiries`}
          action={
            <div className="inline-flex rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-1">
              <button
                type="button"
                onClick={() => setTab("whatsapp")}
                className={`min-h-9 rounded-lg px-3.5 text-xs font-semibold transition-colors ${tab === "whatsapp" ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#111827]"}`}
              >
                WhatsApp ({waRows.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("form")}
                className={`min-h-9 rounded-lg px-3.5 text-xs font-semibold transition-colors ${tab === "form" ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#111827]"}`}
              >
                Forms ({formRows.length})
              </button>
            </div>
          }
        />
        <div className="border-b border-[#F3F4F6] p-4">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[#6B7280]">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "whatsapp"
                  ? "Search name, phone, or product…"
                  : "Search name, email, or company…"
              }
              className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
          </label>
        </div>

        {tab === "whatsapp" ? (
          waLeads.isPending ? (
            <AdminLoading label="Loading WhatsApp inquiries" />
          ) : waLeads.isError ? (
            <AdminError
              detail="The inquiry feed could not be loaded."
              onRetry={() => void waLeads.refetch()}
            />
          ) : filteredWa.length === 0 ? (
            <EmptyState
              title="No WhatsApp inquiries"
              detail="When a customer starts an order conversation, it will appear here."
            />
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {filteredWa.map((lead) => (
                <article
                  key={lead.id}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(200px,1.2fr)_minmax(160px,1fr)_150px_150px_40px] lg:items-center lg:px-6"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      {lead.name || "Unknown customer"}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[#6B7280]">
                      <Phone className="h-3 w-3" /> {lead.phone}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#374151]">
                      {lead.product_title || "General quote"}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#9CA3AF]">
                      {lead.message || "No message captured"}
                    </p>
                  </div>
                  <StatusPill status={lead.status} />
                  <select
                    aria-label={`Status for ${lead.name}`}
                    value={lead.status}
                    onChange={(e) =>
                      waStatusMutation.mutate({
                        id: lead.id,
                        status: e.target.value as WhatsappLead["status"],
                      })
                    }
                    className={inputClass}
                  >
                    {waStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 lg:justify-end">
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open WhatsApp"
                      className="rounded-lg p-2 text-[#166534] hover:bg-[#DCFCE7]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => waDeleteMutation.mutate(lead.id)}
                      aria-label="Delete lead"
                      className="rounded-lg p-2 text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : formLeads.isPending ? (
          <AdminLoading label="Loading form leads" />
        ) : formLeads.isError ? (
          <AdminError
            detail="Form leads could not be loaded."
            onRetry={() => void formLeads.refetch()}
          />
        ) : filteredForm.length === 0 ? (
          <EmptyState
            title="No form submissions"
            detail="Contact form submissions will appear here."
          />
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {filteredForm.map((lead) => (
              <article
                key={lead.id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(200px,1.2fr)_minmax(160px,1fr)_150px_40px] lg:items-center lg:px-6"
              >
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{lead.name || "Unknown"}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <Mail className="h-3 w-3" /> {lead.email}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#374151]">
                    {lead.company || "No company"}
                  </p>
                  <p className="mt-1 truncate text-xs text-[#9CA3AF]">
                    {lead.service || "General enquiry"}
                  </p>
                </div>
                <select
                  aria-label={`Status for ${lead.name}`}
                  value={lead.status}
                  onChange={(e) =>
                    formStatusMutation.mutate({
                      id: lead.id,
                      status: e.target.value as FormLead["status"],
                    })
                  }
                  className={inputClass}
                >
                  {formStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => formDeleteMutation.mutate(lead.id)}
                  aria-label="Delete lead"
                  className="justify-self-end rounded-lg p-2 text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </AdminPage>
  );
}
