import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  FileText,
  History,
  Send,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPageDocument,
  listSavedSections,
  listPageRevisions,
  publishPageDocument,
  restorePageRevision,
  savePageDraft,
} from "@/lib/cms.functions";
import {
  blockCatalog,
  getDefaultPageDocument,
  type PageBlock,
  type PageBlockItem,
  type PageId,
  type PageDocument,
} from "@/lib/page-editor";
import {
  AdminPage,
  Panel,
  PanelHeading,
  StatusPill,
  Toggle,
  adminInput,
} from "@/components/admin/ui";
import { logAdminInteraction } from "@/lib/storefront";
import { AssetLibrary, CarouselStudio } from "@/components/admin/AssetStudio";
import { ReusableSectionsStudio } from "@/components/admin/ReusableSectionsStudio";

export type StudioMode =
  "landing" | "inner" | "legal" | "categories" | "carousel" | "assets" | "sections" | "global";

const pageOptions: Array<{
  id: PageId;
  label: string;
  path: string;
  studio: Exclude<StudioMode, "carousel" | "assets" | "sections">;
}> = [
  { id: "home", label: "Home", path: "/", studio: "landing" },
  { id: "shop", label: "Shop", path: "/shop", studio: "inner" },
  { id: "solutions", label: "Solutions", path: "/solutions", studio: "inner" },
  { id: "about", label: "About", path: "/about", studio: "inner" },
  { id: "contact", label: "Contact", path: "/contact", studio: "inner" },
  { id: "category", label: "Category", path: "/category/apparel", studio: "inner" },
  { id: "product", label: "Product", path: "/shop", studio: "inner" },
  { id: "work", label: "Work", path: "/about", studio: "inner" },
  { id: "privacy", label: "Privacy", path: "/privacy-policy", studio: "legal" },
  { id: "terms", label: "Terms", path: "/terms", studio: "legal" },
  { id: "cookies", label: "Cookies", path: "/cookies", studio: "legal" },
];

type PageRecord = {
  draft?: PageDocument;
  draft_revision?: number;
  published_revision?: number;
  updated_at?: string;
};

function fieldLabel(key: string) {
  return key
    .replaceAll("_", " ")
    .replaceAll(".", " / ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function blockDetail(block: PageBlock) {
  const catalogItem = blockCatalog.find((item) => item.kind === block.kind);
  return catalogItem?.detail ?? "Content block";
}

function createDocument(pageId: PageId, draft: PageDocument | undefined): PageDocument {
  const fallback = getDefaultPageDocument(pageId);
  return {
    ...fallback,
    ...(draft ?? {}),
    pageId,
    blocks: draft?.blocks ?? fallback.blocks,
    seo: { ...fallback.seo, ...(draft?.seo ?? {}) },
  };
}

const studioMeta: Array<{ id: StudioMode; label: string; detail: string }> = [
  { id: "landing", label: "Landing studio", detail: "Home sections" },
  { id: "inner", label: "Inner pages", detail: "Shop, services & work" },
  { id: "legal", label: "Legal studio", detail: "Privacy, terms & cookies" },
  { id: "categories", label: "Category studio", detail: "Homepage category cards" },
  { id: "carousel", label: "Carousel studio", detail: "Hero slides" },
  { id: "assets", label: "Asset studio", detail: "Media library" },
  { id: "sections", label: "Sections studio", detail: "Reusable patterns" },
  { id: "global", label: "Global studio", detail: "Brand, nav & SEO" },
];

export function StructuredPageBuilder({
  initialStudio = "landing",
}: {
  initialStudio?: StudioMode;
}) {
  const [studioMode, setStudioMode] = useState<StudioMode>(initialStudio);
  const [pageId, setPageId] = useState<PageId>(
    initialStudio === "landing" || initialStudio === "categories" ? "home" : "solutions",
  );
  const [document, setDocument] = useState<PageDocument>(() => getDefaultPageDocument("home"));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const queryClient = useQueryClient();
  const getPageDocumentFn = useServerFn(getPageDocument);
  const savePageDraftFn = useServerFn(savePageDraft);
  const publishPageDocumentFn = useServerFn(publishPageDocument);
  const listPageRevisionsFn = useServerFn(listPageRevisions);
  const restorePageRevisionFn = useServerFn(restorePageRevision);
  const pageDocument = useQuery({
    queryKey: ["structured-page-document", pageId],
    queryFn: () => getPageDocumentFn({ data: { pageId } }),
  });
  const revisions = useQuery({
    queryKey: ["structured-page-revisions", pageId],
    queryFn: () => listPageRevisionsFn({ data: { pageId } }),
  });
  const pageRecord = pageDocument.data as PageRecord | null | undefined;

  useEffect(() => {
    const next = createDocument(pageId, pageRecord?.draft);
    setDocument(next);
    setSelectedBlockId(
      studioMode === "categories"
        ? (next.blocks.find((block) => block.id === "categories")?.id ?? null)
        : (next.blocks[0]?.id ?? null),
    );
    setDirty(false);
  }, [pageId, pageRecord?.draft, studioMode]);

  const saveMutation = useMutation({
    mutationFn: () => savePageDraftFn({ data: { document } }),
    onSuccess: () => {
      setDirty(false);
      void logAdminInteraction({ label: "Save draft", category: "page-builder" });
      void queryClient.invalidateQueries({ queryKey: ["structured-page-document", pageId] });
      void queryClient.invalidateQueries({ queryKey: ["structured-page-revisions", pageId] });
      toast.success("Draft saved");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save draft"),
  });
  const publishMutation = useMutation({
    mutationFn: () =>
      publishPageDocumentFn({
        data: {
          document,
          expectedRevision: pageRecord?.draft_revision,
        },
      }),
    onSuccess: () => {
      setDirty(false);
      void logAdminInteraction({ label: "Publish page", category: "page-builder" });
      void queryClient.invalidateQueries({ queryKey: ["structured-page-document", pageId] });
      toast.success("Page published");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not publish page"),
  });
  const restoreMutation = useMutation({
    mutationFn: (revision: number) => restorePageRevisionFn({ data: { pageId, revision } }),
    onSuccess: () => {
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["structured-page-document", pageId] });
      toast.success("Revision restored to draft");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not restore revision"),
  });

  const selectedBlock = document.blocks.find((block) => block.id === selectedBlockId) ?? null;
  const pageOption = pageOptions.find((option) => option.id === pageId) ?? pageOptions[0]!;
  const visiblePageOptions = pageOptions.filter(
    (option) =>
      option.studio === studioMode || (studioMode === "categories" && option.id === "home"),
  );
  const isPageStudio =
    studioMode === "landing" ||
    studioMode === "inner" ||
    studioMode === "legal" ||
    studioMode === "categories";

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  const updateDocument = (next: PageDocument) => {
    setDocument(next);
    setDirty(true);
  };
  const updateBlock = (blockId: string, update: (block: PageBlock) => PageBlock) => {
    updateDocument({
      ...document,
      blocks: document.blocks.map((block) => (block.id === blockId ? update(block) : block)),
    });
  };
  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= document.blocks.length) return;
    const blocks = [...document.blocks];
    const [block] = blocks.splice(index, 1);
    if (!block) return;
    blocks.splice(target, 0, block);
    updateDocument({ ...document, blocks });
  };
  const removeBlock = (blockId: string) => {
    const remaining = document.blocks.filter((block) => block.id !== blockId);
    updateDocument({ ...document, blocks: remaining });
    setSelectedBlockId(remaining[0]?.id ?? null);
  };
  const addBlock = (kind: (typeof blockCatalog)[number]["kind"]) => {
    const template = blockCatalog.find((item) => item.kind === kind);
    if (!template) return;
    const block: PageBlock = {
      id: `${kind}-${Date.now()}`,
      kind,
      label: template.label,
      visible: true,
      mobileVisible: true,
      content: { ...template.defaultContent },
      items: [],
      design: {},
    };
    updateDocument({ ...document, blocks: [...document.blocks, block] });
    setSelectedBlockId(block.id);
  };
  const insertReusableDocument = (savedDocument: PageDocument) => {
    const cloneBlock = (block: PageBlock, suffix: string): PageBlock => {
      const clone = { ...block, id: `${block.id}-${Date.now()}-${suffix}` };
      return block.children
        ? {
            ...clone,
            children: block.children.map((child, childIndex) =>
              cloneBlock(child, `${suffix}-${childIndex}`),
            ),
          }
        : clone;
    };
    const insertedBlocks = savedDocument.blocks.map((block, index) =>
      cloneBlock(block, String(index)),
    );
    updateDocument({ ...document, blocks: [...document.blocks, ...insertedBlocks] });
    setSelectedBlockId(insertedBlocks[0]?.id ?? null);
    toast.success(`${insertedBlocks.length} reusable sections inserted`);
  };
  const updateItem = (blockId: string, index: number, patch: Partial<PageBlockItem>) => {
    updateBlock(blockId, (block) => ({
      ...block,
      items: block.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  };
  const changePage = (nextPageId: PageId) => {
    if (dirty && !window.confirm("You have unsaved changes. Switch pages anyway?")) return;
    setPageId(nextPageId);
  };
  const changeStudio = (nextStudio: StudioMode) => {
    setStudioMode(nextStudio);
    if (nextStudio === "landing") setPageId("home");
    if (nextStudio === "inner") setPageId("solutions");
    if (nextStudio === "legal") setPageId("privacy");
    if (nextStudio === "categories") setPageId("home");
  };

  return (
    <AdminPage
      eyebrow={`${studioMeta.find((studio) => studio.id === studioMode)?.label ?? "Studio"}`}
      title={
        studioMode === "landing"
          ? "Build the landing page section by section."
          : studioMode === "inner"
            ? "Keep every inner page consistent."
            : studioMode === "legal"
              ? "Keep policy pages clear and current."
              : studioMode === "categories"
                ? "Shape the category cards customers browse first."
                : studioMode === "global"
                  ? "Control the shared site system."
                  : "Manage the parts that make the site move."
      }
      description="Give each part of the website its own focused workspace, with clear drafts, live data, and safe publishing."
      action={
        isPageStudio ? (
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={dirty ? "Draft changes" : "Saved"} />
            <a
              href={pageOption.path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-semibold text-[#344054] transition-colors hover:border-[#0E1331] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Preview
            </a>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={!dirty || saveMutation.isPending}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#0E1331] bg-white px-3.5 py-2 text-xs font-semibold text-[#0E1331] transition-colors hover:bg-[#F8F9F6] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />{" "}
              {saveMutation.isPending ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || pageDocument.isPending}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#ED1D2B] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#C81724] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />{" "}
              {publishMutation.isPending ? "Publishing…" : "Publish"}
            </button>
          </div>
        ) : (
          <StatusPill
            status={`${studioMeta.find((studio) => studio.id === studioMode)?.label ?? "Studio"} ready`}
          />
        )
      }
    >
      <Panel className="overflow-hidden">
        <div className="grid gap-1 border-b border-[#EAECF0] p-2 sm:grid-cols-2 lg:grid-cols-7">
          {studioMeta.map((studio) => (
            <button
              key={studio.id}
              type="button"
              onClick={() => changeStudio(studio.id)}
              className={`min-h-14 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B] ${studioMode === studio.id ? "bg-[#0E1331] text-white" : "text-[#475467] hover:bg-[#F2F4F7]"}`}
            >
              <span className="block text-xs font-semibold">{studio.label}</span>
              <span
                className={`mt-1 block text-[10px] ${studioMode === studio.id ? "text-white/60" : "text-[#98A2B3]"}`}
              >
                {studio.detail}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {isPageStudio ? (
        <div className="grid items-start gap-5 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          <Panel className="min-w-0 overflow-hidden xl:sticky xl:top-5 xl:max-h-[calc(100svh-14rem)] xl:overflow-y-auto">
            <PanelHeading
              icon={FileText}
              title={
                studioMode === "landing"
                  ? "Landing page"
                  : studioMode === "inner"
                    ? "Inner pages"
                    : studioMode === "legal"
                      ? "Legal pages"
                      : "Category section"
              }
              detail="Choose a document to edit"
            />
            <div className="space-y-1 p-3">
              {visiblePageOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => changePage(option.id)}
                  className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B] ${option.id === pageId ? "bg-[#0E1331] font-semibold text-white" : "text-[#475467] hover:bg-[#F2F4F7]"}`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`text-[10px] ${option.id === pageId ? "text-white/60" : "text-[#98A2B3]"}`}
                  >
                    {option.path}
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="min-w-0 overflow-hidden">
            <PanelHeading
              icon={FileText}
              title={document.title || pageOption.label}
              detail={`${document.blocks.length} sections · ${pageOption.path}`}
            />
            <div className="space-y-5 p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-xs font-semibold text-[#344054]">
                  Page title
                  <input
                    value={document.title}
                    onChange={(event) => updateDocument({ ...document, title: event.target.value })}
                    className={`${adminInput} mt-2`}
                  />
                </label>
                <label className="block text-xs font-semibold text-[#344054]">
                  Page description
                  <input
                    value={document.description}
                    onChange={(event) =>
                      updateDocument({ ...document, description: event.target.value })
                    }
                    className={`${adminInput} mt-2`}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-[#EAECF0] pt-5">
                <div>
                  <h2 className="text-sm font-semibold text-[#101828]">Content outline</h2>
                  <p className="mt-1 text-xs text-[#667085]">
                    Select a section to edit its fields.
                  </p>
                </div>
                <select
                  value=""
                  onChange={(event) => {
                    if (event.target.value)
                      addBlock(event.target.value as (typeof blockCatalog)[number]["kind"]);
                  }}
                  className="min-h-10 rounded-xl border border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-[#344054] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
                  aria-label="Add a content block"
                >
                  <option value="">Add section…</option>
                  {blockCatalog.map((item) => (
                    <option key={item.kind} value={item.kind}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2" aria-live="polite">
                {document.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B] ${selectedBlockId === block.id ? "border-[#ED1D2B]/40 bg-[#FFF5F5]" : "border-[#EAECF0] bg-white hover:border-[#98A2B3]"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedBlockId(block.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F2F4F7] text-xs font-semibold text-[#667085]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#101828]">
                          {block.label}
                        </span>
                        <span className="mt-1 block truncate text-xs text-[#667085]">
                          {blockDetail(block)}
                        </span>
                      </span>
                    </button>
                    <span className="flex shrink-0 items-center gap-1">
                      <span
                        className={`mr-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${block.visible ? "text-[#027A48]" : "text-[#98A2B3]"}`}
                      >
                        {block.visible ? "Live" : "Hidden"}
                      </span>
                      <button
                        type="button"
                        aria-label={`Move ${block.label} up`}
                        disabled={index === 0}
                        onClick={() => moveBlock(index, -1)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#667085] hover:bg-[#F2F4F7] disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${block.label} down`}
                        disabled={index === document.blocks.length - 1}
                        onClick={() => moveBlock(index, 1)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#667085] hover:bg-[#F2F4F7] disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                ))}
                {!document.blocks.length ? (
                  <p className="rounded-xl bg-[#F9FAFB] px-4 py-8 text-center text-sm text-[#667085]">
                    No sections yet. Add one to start building.
                  </p>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel className="min-w-0 overflow-hidden xl:sticky xl:top-5 xl:max-h-[calc(100svh-14rem)] xl:overflow-y-auto">
            <PanelHeading
              icon={selectedBlock ? Eye : FileText}
              title={selectedBlock?.label ?? "Section editor"}
              detail={selectedBlock ? blockDetail(selectedBlock) : "Select a section"}
            />
            {selectedBlock ? (
              <div className="space-y-5 p-5">
                <div className="flex items-center justify-between rounded-xl bg-[#F8F9FC] px-3 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#344054]">Visible on storefront</p>
                    <p className="mt-1 text-[11px] text-[#667085]">
                      Hide a section without deleting its content.
                    </p>
                  </div>
                  <Toggle
                    label={`Toggle ${selectedBlock.label}`}
                    checked={selectedBlock.visible}
                    onChange={(visible) =>
                      updateBlock(selectedBlock.id, (block) => ({ ...block, visible }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#EAECF0] px-3 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#344054]">Visible on mobile</p>
                    <p className="mt-1 text-[11px] text-[#667085]">
                      Keep this section out of compact storefront layouts when needed.
                    </p>
                  </div>
                  <Toggle
                    label={`Toggle ${selectedBlock.label} on mobile`}
                    checked={selectedBlock.mobileVisible}
                    onChange={(mobileVisible) =>
                      updateBlock(selectedBlock.id, (block) => ({ ...block, mobileVisible }))
                    }
                  />
                </div>

                <div className="space-y-4">
                  {Object.entries(selectedBlock.content).map(([key, value]) => (
                    <label key={key} className="block text-xs font-semibold text-[#344054]">
                      {fieldLabel(key)}
                      {value.length > 100 ||
                      key === "body" ||
                      key.toLowerCase().includes("description") ? (
                        <textarea
                          value={value}
                          onChange={(event) =>
                            updateBlock(selectedBlock.id, (block) => ({
                              ...block,
                              content: { ...block.content, [key]: event.target.value },
                            }))
                          }
                          rows={4}
                          className={`${adminInput} mt-2 resize-y`}
                        />
                      ) : (
                        <input
                          value={value}
                          onChange={(event) =>
                            updateBlock(selectedBlock.id, (block) => ({
                              ...block,
                              content: { ...block.content, [key]: event.target.value },
                            }))
                          }
                          className={`${adminInput} mt-2`}
                        />
                      )}
                    </label>
                  ))}
                  {!Object.keys(selectedBlock.content).length ? (
                    <p className="rounded-xl border border-dashed border-[#D0D5DD] px-3 py-4 text-xs leading-5 text-[#667085]">
                      This section is connected to live catalog or media data. Use its visibility
                      and ordering controls here.
                    </p>
                  ) : null}
                </div>

                {selectedBlock.items.length || selectedBlock.kind === "categories" ? (
                  <div className="border-t border-[#EAECF0] pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold text-[#344054]">Cards</h3>
                      {selectedBlock.kind === "categories" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateBlock(selectedBlock.id, (block) => ({
                              ...block,
                              items: [
                                ...block.items,
                                {
                                  id: `category-${Date.now()}`,
                                  label: "New category",
                                  description: "Add a short description",
                                  href: "/category/apparel",
                                  buttonLabel: "Browse",
                                  sortOrder: block.items.length,
                                },
                              ],
                            }))
                          }
                          className="rounded-lg border border-[#D0D5DD] px-2.5 py-1.5 text-[11px] font-semibold text-[#344054] hover:border-[#ED1D2B] hover:text-[#B42318]"
                        >
                          Add category
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-3">
                      {selectedBlock.items.map((item, index) => (
                        <div key={item.id} className="rounded-xl border border-[#EAECF0] p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                              Card {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(selectedBlock.id, (block) => ({
                                  ...block,
                                  items: block.items.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                              aria-label={`Remove card ${index + 1}`}
                              className="text-[#98A2B3] hover:text-[#D92D20]"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <input
                              value={item.label}
                              onChange={(event) =>
                                updateItem(selectedBlock.id, index, { label: event.target.value })
                              }
                              aria-label={`Card ${index + 1} label`}
                              className={adminInput}
                            />
                            <textarea
                              value={item.description}
                              onChange={(event) =>
                                updateItem(selectedBlock.id, index, {
                                  description: event.target.value,
                                })
                              }
                              aria-label={`Card ${index + 1} description`}
                              rows={2}
                              className={`${adminInput} resize-y`}
                            />
                            <input
                              value={item.href}
                              onChange={(event) =>
                                updateItem(selectedBlock.id, index, { href: event.target.value })
                              }
                              aria-label={`Card ${index + 1} link`}
                              className={adminInput}
                            />
                            <input
                              value={item.buttonLabel ?? "Browse"}
                              onChange={(event) =>
                                updateItem(selectedBlock.id, index, {
                                  buttonLabel: event.target.value,
                                })
                              }
                              aria-label={`Card ${index + 1} button label`}
                              placeholder="Button label"
                              className={adminInput}
                            />
                            <input
                              value={item.image ?? ""}
                              onChange={(event) =>
                                updateItem(selectedBlock.id, index, { image: event.target.value })
                              }
                              aria-label={`Card ${index + 1} image URL`}
                              placeholder="Image URL"
                              className={adminInput}
                            />
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                              <label className="text-xs font-medium text-[#667085]">
                                Order
                                <input
                                  type="number"
                                  min="0"
                                  value={item.sortOrder ?? index}
                                  onChange={(event) =>
                                    updateItem(selectedBlock.id, index, {
                                      sortOrder: Number(event.target.value) || 0,
                                    })
                                  }
                                  className={`${adminInput} mt-1`}
                                />
                              </label>
                              <label className="flex items-center gap-2 pt-5 text-xs font-medium text-[#667085]">
                                <input
                                  type="checkbox"
                                  checked={item.visible !== false}
                                  onChange={(event) =>
                                    updateItem(selectedBlock.id, index, {
                                      visible: event.target.checked,
                                    })
                                  }
                                />
                                Visible
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => removeBlock(selectedBlock.id)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#FDA29B] px-3.5 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FFF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D92D20]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove section
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-[#667085]">
                Choose a section from the outline.
              </div>
            )}
          </Panel>
        </div>
      ) : null}

      {studioMode === "carousel" ? <CarouselStudio /> : null}
      {studioMode === "assets" ? <AssetLibrary /> : null}
      {studioMode === "sections" ? (
        <ReusableSectionsStudio document={document} onInsert={insertReusableDocument} />
      ) : null}
      {studioMode === "global" ? (
        <Panel>
          <PanelHeading
            icon={FileText}
            title="Global site system"
            detail="Open the dedicated workspace for shared site controls"
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Global settings", "/admin/theme", "Branding, navigation, footer & SEO"],
              ["Catalog studio", "/admin/catalog", "Products, pricing & visibility"],
              ["Services studio", "/admin/services", "Offerings and delivery details"],
              ["Lead studio", "/admin/whatsapp", "Customer enquiries and follow-up"],
            ].map(([label, href, detail]) => (
              <a
                key={href}
                href={href}
                className="rounded-2xl border border-[#EAECF0] bg-white p-4 transition-colors hover:border-[#ED1D2B]/40 hover:bg-[#FFF8F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
              >
                <p className="text-sm font-semibold text-[#101828]">{label}</p>
                <p className="mt-2 text-xs leading-5 text-[#667085]">{detail}</p>
              </a>
            ))}
          </div>
        </Panel>
      ) : null}

      {isPageStudio ? (
        <Panel>
          <PanelHeading
            icon={History}
            title="Revision history"
            detail="Restore a previous draft without leaving the builder"
          />
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <div>
              <p className="text-sm font-semibold text-[#101828]">
                Current draft v{pageRecord?.draft_revision ?? 0}
              </p>
              <p className="mt-1 text-xs text-[#667085]">
                Publishing keeps the current draft revision as the live version.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                defaultValue=""
                onChange={(event) => {
                  const revision = Number(event.target.value);
                  if (revision) restoreMutation.mutate(revision);
                  event.currentTarget.value = "";
                }}
                disabled={restoreMutation.isPending || !revisions.data?.length}
                aria-label="Restore a previous revision"
                className="min-h-10 rounded-xl border border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-[#344054] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
              >
                <option value="">Restore revision…</option>
                {(revisions.data ?? []).map((revision) => (
                  <option key={revision.id} value={revision.revision}>
                    v{revision.revision} · {new Date(revision.created_at).toLocaleString()}
                  </option>
                ))}
              </select>
              {dirty ? <span className="text-xs text-[#B54708]">Unsaved changes</span> : null}
            </div>
          </div>
        </Panel>
      ) : null}
    </AdminPage>
  );
}
