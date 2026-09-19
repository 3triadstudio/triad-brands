import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Library, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSavedSection, listSavedSections, saveSavedSection } from "@/lib/cms.functions";
import type { PageDocument } from "@/lib/page-editor";
import { Panel, PanelHeading, adminInput } from "@/components/admin/ui";

export function ReusableSectionsStudio({
  document,
  onInsert,
}: {
  document: PageDocument;
  onInsert: (document: PageDocument) => void;
}) {
  const queryClient = useQueryClient();
  const listSectionsFn = useServerFn(listSavedSections);
  const saveSectionFn = useServerFn(saveSavedSection);
  const deleteSectionFn = useServerFn(deleteSavedSection);
  const sections = useQuery({
    queryKey: ["structured-builder-saved-sections"],
    queryFn: () => listSectionsFn({}),
  });
  const [name, setName] = useState("");
  const saveMutation = useMutation({
    mutationFn: () => saveSectionFn({ data: { name: name.trim(), document } }),
    onSuccess: () => {
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["structured-builder-saved-sections"] });
      toast.success("Reusable section saved");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save reusable section"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSectionFn({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["structured-builder-saved-sections"] });
      toast.success("Reusable section deleted");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete reusable section"),
  });
  const savedSections = (sections.data ?? []) as Array<{
    id: string;
    name: string;
    document?: PageDocument;
    updated_at?: string;
  }>;

  return (
    <Panel>
      <PanelHeading
        icon={Library}
        title="Reusable sections"
        detail="Save page patterns for the team to reuse"
      />
      <div className="grid gap-5 p-5 md:p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl bg-[#F8F9FC] p-4">
          <p className="text-sm font-semibold text-[#101828]">Save the current page pattern</p>
          <p className="mt-1 text-xs leading-5 text-[#667085]">
            This stores the current structured document as a reusable starting point for future
            pages.
          </p>
          <label className="mt-4 block text-xs font-semibold text-[#344054]">
            Section name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Campaign landing page"
              className={`${adminInput} mt-2`}
            />
          </label>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!name.trim() || saveMutation.isPending}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0E1331] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#20284D] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {saveMutation.isPending ? "Saving…" : "Save pattern"}
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#101828]">Saved patterns</h3>
              <p className="mt-1 text-xs text-[#667085]">
                {savedSections.length} reusable documents
              </p>
            </div>
            <Copy className="h-4 w-4 text-[#98A2B3]" aria-hidden="true" />
          </div>
          {sections.isPending ? (
            <p className="mt-4 text-sm text-[#667085]">Loading patterns…</p>
          ) : null}
          {!sections.isPending && !savedSections.length ? (
            <p className="mt-4 rounded-xl border border-dashed border-[#D0D5DD] px-4 py-7 text-center text-sm text-[#667085]">
              No reusable patterns yet.
            </p>
          ) : null}
          <div className="mt-3 space-y-2">
            {savedSections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-3 rounded-xl border border-[#EAECF0] bg-white px-3 py-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FFF4E5] text-[#B54708]">
                  <Library className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#344054]">{section.name}</p>
                  <p className="mt-1 text-[11px] text-[#98A2B3]">
                    {section.document?.blocks?.length ?? 0} sections
                    {section.updated_at
                      ? ` · ${new Date(section.updated_at).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => section.document && onInsert(section.document)}
                  disabled={!section.document}
                  className="min-h-9 rounded-lg border border-[#D0D5DD] px-2.5 text-[10px] font-semibold text-[#344054] hover:border-[#ED1D2B] hover:text-[#B42318] disabled:opacity-40"
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${section.name}?`))
                      deleteMutation.mutate(section.id);
                  }}
                  aria-label={`Delete ${section.name}`}
                  className="grid h-9 w-9 place-items-center rounded-lg text-[#98A2B3] hover:bg-[#FFF5F5] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D92D20]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
