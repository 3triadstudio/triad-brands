import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { History, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ControlLabel } from "@/components/builder/FieldControls";
import { Modal, ModalFooter, inputClass } from "@/components/admin/ui";
import {
  deleteSavedSection,
  getPageRevision,
  listPageRevisions,
  listSavedSections,
  saveSection,
} from "@/lib/pages.functions";
import { createElementId, type BuilderDocument, type BuilderElement } from "@/lib/builder/types";
import type { PageId } from "@/lib/page-editor";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Page settings — the document's own SEO                              */
/* ------------------------------------------------------------------ */

export function PageSettingsModal({
  document,
  onChange,
  onClose,
}: {
  document: BuilderDocument;
  onChange: (next: BuilderDocument) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(document);
  const seo = draft.seo;
  const set = (key: keyof typeof seo, value: string | boolean) =>
    setDraft((current) => ({ ...current, seo: { ...current.seo, [key]: value } }));

  const titleLength = seo.title.length;
  const descriptionLength = seo.description.length;

  return (
    <Modal
      title="Page settings"
      subtitle="Search and social metadata for this page"
      onClose={onClose}
    >
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <ControlLabel>Page name</ControlLabel>
          <input
            value={draft.title}
            onChange={(event) => setDraft((c) => ({ ...c, title: event.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <ControlLabel>Search title</ControlLabel>
          <input
            value={seo.title}
            onChange={(event) => set("title", event.target.value)}
            className={inputClass}
          />
          <p
            className={cn(
              "mt-1 text-xs",
              titleLength > 62 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {titleLength}/62 characters — longer titles get truncated in results
          </p>
        </div>

        <div>
          <ControlLabel>Meta description</ControlLabel>
          <textarea
            value={seo.description}
            onChange={(event) => set("description", event.target.value)}
            rows={3}
            className={cn(inputClass, "resize-y")}
          />
          <p
            className={cn(
              "mt-1 text-xs",
              descriptionLength < 80 || descriptionLength > 160
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {descriptionLength}/160 characters — aim for 120–160
          </p>
        </div>

        <div>
          <ControlLabel>Canonical URL</ControlLabel>
          <input
            value={seo.canonical}
            onChange={(event) => set("canonical", event.target.value)}
            placeholder="https://www.triadbrands.co.ke/about"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave empty to keep the page&apos;s own address.
          </p>
        </div>

        <div>
          <ControlLabel>Social share image</ControlLabel>
          <input
            value={seo.ogImage}
            onChange={(event) => set("ogImage", event.target.value)}
            placeholder="https://…/og-image.png"
            className={inputClass}
          />
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
          <span>
            <span className="text-sm">Hide from search engines</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Adds a noindex tag. Use for pages you do not want listed.
            </span>
          </span>
          <input
            type="checkbox"
            checked={seo.noindex}
            onChange={(event) => set("noindex", event.target.checked)}
          />
        </label>
      </div>

      <ModalFooter
        onCancel={onClose}
        onSave={() => {
          onChange(draft);
          onClose();
        }}
      />
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Revisions                                                           */
/* ------------------------------------------------------------------ */

export function RevisionsModal({
  pageId,
  onRestore,
  onClose,
}: {
  pageId: PageId;
  onRestore: (document: BuilderDocument) => void;
  onClose: () => void;
}) {
  const list = useServerFn(listPageRevisions);
  const fetchOne = useServerFn(getPageRevision);

  const revisions = useQuery({
    queryKey: ["page-revisions", pageId],
    queryFn: () => list({ data: { pageId } }),
  });

  const restore = useMutation({
    mutationFn: (revision: number) => fetchOne({ data: { pageId, revision } }),
    onSuccess: (document) => {
      onRestore(document);
      toast.success("Revision loaded — review it, then publish");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Modal title="Revision history" subtitle="Every publish is kept" onClose={onClose}>
      <div className="max-h-[26rem] overflow-y-auto p-4 md:p-6">
        {revisions.isPending ? (
          <p className="text-sm text-muted-foreground">Loading history…</p>
        ) : revisions.isError ? (
          <p className="text-sm text-destructive">{(revisions.error as Error).message}</p>
        ) : !revisions.data?.length ? (
          <p className="text-sm text-muted-foreground">
            No revisions yet. The first publish starts the history.
          </p>
        ) : (
          <ul className="space-y-2">
            {revisions.data.map((revision) => (
              <li
                key={revision.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  Revision {revision.revision}
                  <span className="text-xs text-muted-foreground">
                    {new Date(revision.created_at).toLocaleString()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => restore.mutate(revision.revision)}
                  disabled={restore.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Saved sections                                                      */
/* ------------------------------------------------------------------ */

export function SavedSectionsModal({
  selected,
  onInsert,
  onClose,
}: {
  selected: BuilderElement | null;
  onInsert: (element: BuilderElement) => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const list = useServerFn(listSavedSections);
  const save = useServerFn(saveSection);
  const remove = useServerFn(deleteSavedSection);
  const [name, setName] = useState("");

  const sections = useQuery({ queryKey: ["saved-sections"], queryFn: () => list({}) });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: { name: name.trim(), document: selected as unknown as Record<string, unknown> },
      }),
    onSuccess: () => {
      setName("");
      toast.success("Section saved to the library");
      void queryClient.invalidateQueries({ queryKey: ["saved-sections"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed");
      void queryClient.invalidateQueries({ queryKey: ["saved-sections"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  /** Re-ids a stored subtree so inserting the same section twice is safe. */
  const reId = (element: BuilderElement): BuilderElement => ({
    ...element,
    id: createElementId(element.type),
    children: (element.children ?? []).map(reId),
  });

  return (
    <Modal title="Saved sections" subtitle="Reuse a section across pages" onClose={onClose}>
      <div className="space-y-5 p-4 md:p-6">
        <div className="rounded-lg border border-border p-3">
          <ControlLabel>Save the current selection</ControlLabel>
          {selected ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Section name"
                className={inputClass}
              />
              <button
                type="button"
                disabled={!name.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a section on the canvas to save it here.
            </p>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {sections.isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !sections.data?.length ? (
            <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          ) : (
            <ul className="space-y-2">
              {sections.data.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <span className="truncate text-sm">{entry.name}</span>
                  <span className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onInsert(reId(entry.document as unknown as BuilderElement));
                        onClose();
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Insert
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
                      aria-label="Delete saved section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
