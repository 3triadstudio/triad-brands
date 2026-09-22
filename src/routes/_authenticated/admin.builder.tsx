import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  History,
  Library,
  Monitor,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  Settings2,
  Smartphone,
  Tablet,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { BuilderCanvas, type DropTarget } from "@/components/builder/BuilderCanvas";
import { Inspector } from "@/components/builder/Inspector";
import { LeftPanel } from "@/components/builder/LeftPanel";
import {
  PageSettingsModal,
  RevisionsModal,
  SavedSectionsModal,
} from "@/components/builder/BuilderPanels";
import { AdminError, AdminLoading, inputClass } from "@/components/admin/ui";
import { uploadAsset } from "@/lib/admin.functions";
import { getBuilderPage, publishBuilderPage, saveBuilderDraft } from "@/lib/pages.functions";
import { createWidgetElement, getWidget } from "@/lib/builder/registry";
import {
  cloneElement,
  createElementId,
  findElement,
  findParent,
  insertElement,
  isDescendant,
  removeElement,
  updateElement,
  type BuilderDocument,
  type BuilderElement,
  type Breakpoint,
  type JsonValue,
} from "@/lib/builder/types";
import { pageIdSchema, type PageId } from "@/lib/page-editor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/builder")({
  component: BuilderPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: pageIdSchema.catch("home").parse(search["page"] ?? "home"),
  }),
});

const editablePages: Array<{ id: PageId; label: string; path: string }> = [
  { id: "header", label: "◆ Site header (global)", path: "/" },
  { id: "footer", label: "◆ Site footer (global)", path: "/" },
  { id: "home", label: "Home", path: "/" },
  { id: "about", label: "About", path: "/about" },
  { id: "solutions", label: "Solutions", path: "/solutions" },
  { id: "shop", label: "Shop", path: "/shop" },
  { id: "contact", label: "Contact", path: "/contact" },
  { id: "work", label: "Work", path: "/work" },
  { id: "category", label: "Category template", path: "/category/apparel" },
  { id: "product", label: "Product template", path: "/product" },
  { id: "privacy", label: "Privacy policy", path: "/privacy-policy" },
  { id: "terms", label: "Terms", path: "/terms" },
  { id: "cookies", label: "Cookie policy", path: "/cookies" },
];

/** Bounded undo history — deep enough to feel safe, small enough to stay cheap. */
const HISTORY_LIMIT = 60;

function BuilderPage() {
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const loadPage = useServerFn(getBuilderPage);
  const saveDraft = useServerFn(saveBuilderDraft);
  const publish = useServerFn(publishBuilderPage);
  const upload = useServerFn(uploadAsset);

  const pageQuery = useQuery({
    queryKey: ["builder-page", page],
    queryFn: () => loadPage({ data: { pageId: page } }),
  });

  const [document, setDocument] = useState<BuilderDocument | null>(null);
  const [history, setHistory] = useState<BuilderDocument[]>([]);
  const [future, setFuture] = useState<BuilderDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("base");
  const [dirty, setDirty] = useState(false);
  const [panel, setPanel] = useState<"settings" | "revisions" | "sections" | null>(null);
  // The three panes only fit side by side on very wide screens. Below that the
  // side panels float over the canvas instead of squeezing it to a sliver.
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);

  // Load the draft into local state whenever the page selection changes.
  useEffect(() => {
    if (!pageQuery.data) return;
    setDocument(pageQuery.data.draft);
    setHistory([]);
    setFuture([]);
    setSelectedId(null);
    setDirty(false);
  }, [pageQuery.data]);

  const commit = useCallback((next: BuilderDocument) => {
    setDocument((current) => {
      if (current) setHistory((stack) => [...stack, current].slice(-HISTORY_LIMIT));
      return next;
    });
    setFuture([]);
    setDirty(true);
  }, []);

  const mutateRoot = useCallback((patch: (root: BuilderElement[]) => BuilderElement[]) => {
    setDocument((current) => {
      if (!current) return current;
      setHistory((stack) => [...stack, current].slice(-HISTORY_LIMIT));
      setFuture([]);
      setDirty(true);
      return { ...current, root: patch(current.root) };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((stack) => {
      if (!stack.length) return stack;
      const previous = stack[stack.length - 1]!;
      setDocument((current) => {
        if (current) setFuture((forward) => [current, ...forward].slice(0, HISTORY_LIMIT));
        return previous;
      });
      setDirty(true);
      return stack.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((stack) => {
      if (!stack.length) return stack;
      const next = stack[0]!;
      setDocument((current) => {
        if (current) setHistory((back) => [...back, current].slice(-HISTORY_LIMIT));
        return next;
      });
      setDirty(true);
      return stack.slice(1);
    });
  }, []);

  const [clipboard, setClipboard] = useState<BuilderElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Never hijack typing in the inspector or during inline editing.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const meta = event.metaKey || event.ctrlKey;

      if (!meta && (event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        mutateRoot((root) => removeElement(root, selectedId));
        setSelectedId(null);
        return;
      }
      if (!meta && event.key === "Escape") {
        setSelectedId(null);
        return;
      }
      if (!meta) return;

      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.key === "z" && event.shiftKey) || event.key === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "d" && selectedId) {
        event.preventDefault();
        duplicate(selectedId);
      } else if (event.key === "c" && selectedId) {
        const element = documentRef.current
          ? findElement(documentRef.current.root, selectedId)
          : null;
        if (element) {
          setClipboard(element);
          toast.success("Copied");
        }
      } else if (event.key === "v" && clipboard) {
        event.preventDefault();
        const copy = cloneElement(clipboard);
        mutateRoot((root) => insertElement(root, copy, { parentId: null, index: root.length }));
        setSelectedId(copy.id);
      } else if (event.key === "s") {
        event.preventDefault();
        if (documentRef.current) saveMutation.mutate(documentRef.current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // `saveMutation` is stable enough for this handler; re-binding on every
    // mutation state change would thrash the listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, selectedId, clipboard, mutateRoot]);

  // Warn before losing unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Shortcut handlers close over state; a ref keeps them reading the latest
  // document without re-binding the listener on every keystroke.
  const documentRef = useRef<BuilderDocument | null>(null);
  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  const duplicate = useCallback(
    (id: string) => {
      mutateRoot((root) => {
        const element = findElement(root, id);
        if (!element) return root;
        const parent = findParent(root, id);
        return insertElement(root, cloneElement(element), {
          parentId: parent?.parent?.id ?? null,
          index: (parent?.index ?? 0) + 1,
        });
      });
    },
    [mutateRoot],
  );

  const saveMutation = useMutation({
    mutationFn: (input: BuilderDocument) => saveDraft({ data: { pageId: page, document: input } }),
    onSuccess: () => {
      setDirty(false);
      toast.success("Draft saved");
      void queryClient.invalidateQueries({ queryKey: ["builder-page", page] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: (input: BuilderDocument) => publish({ data: { pageId: page, document: input } }),
    onSuccess: () => {
      setDirty(false);
      toast.success("Published — the live site is updated");
      void queryClient.invalidateQueries({ queryKey: ["builder-page", page] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleUpload = useCallback(
    async (file: File) => {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      // Chunked to avoid blowing the argument limit on large images.
      for (let index = 0; index < bytes.length; index += 8192) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
      }
      const result = await upload({
        data: {
          filename: file.name,
          contentType: file.type || "image/jpeg",
          base64: btoa(binary),
          folder: "media",
        },
      });
      if (!result?.publicUrl) throw new Error("Upload failed");
      return result.publicUrl;
    },
    [upload],
  );

  useEffect(() => {
    if (selectedId) setRightOpen(true);
  }, [selectedId]);

  const selected = useMemo(
    () => (document && selectedId ? findElement(document.root, selectedId) : null),
    [document, selectedId],
  );

  if (pageQuery.isPending) return <AdminLoading label="Opening the page builder" />;
  if (pageQuery.isError) {
    return (
      <AdminError
        title="The builder could not open this page"
        detail={(pageQuery.error as Error).message}
        onRetry={() => void pageQuery.refetch()}
      />
    );
  }
  if (!document) return <AdminLoading label="Preparing the canvas" />;

  const insertWidget = (type: string, target: DropTarget) => {
    const element = createWidgetElement(type, createElementId(type));
    // Dropping a bare widget at the page root wraps it in a section, so the
    // page keeps a consistent structure no matter how it was assembled.
    const definition = getWidget(type);
    const node =
      target.parentId === null && definition && definition.category !== "layout"
        ? {
            ...createWidgetElement("section", createElementId("section")),
            children: [element],
          }
        : element;
    mutateRoot((root) => insertElement(root, node, target));
    setSelectedId(element.id);
  };

  const moveElement = (id: string, target: DropTarget) => {
    if (
      target.parentId === id ||
      (target.parentId && isDescendant(document.root, id, target.parentId))
    ) {
      toast.error("An element cannot be moved inside itself");
      return;
    }
    mutateRoot((root) => {
      const element = findElement(root, id);
      if (!element) return root;
      return insertElement(removeElement(root, id), element, target);
    });
  };

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-border bg-background">
      {/* ------------------------------ toolbar ------------------------------ */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-2.5">
        <select
          value={page}
          onChange={(event) => {
            if (dirty && !window.confirm("Discard unsaved changes on this page?")) return;
            void navigate({ search: { page: event.target.value as PageId } });
          }}
          className={cn(inputClass, "w-48")}
          aria-label="Page to edit"
        >
          {editablePages.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
          {(
            [
              ["base", Monitor, "Desktop"],
              ["tablet", Tablet, "Tablet"],
              ["mobile", Smartphone, "Mobile"],
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setBreakpoint(value)}
              title={label}
              aria-label={label}
              aria-pressed={breakpoint === value}
              className={cn(
                "rounded-md p-2 transition-colors",
                breakpoint === value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={undo}
            disabled={!history.length}
            title="Undo (Cmd+Z)"
            aria-label="Undo"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!future.length}
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <span className="text-xs text-muted-foreground">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel("settings")}
            title="Page settings and SEO"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Settings
          </button>
          <button
            type="button"
            onClick={() => setPanel("sections")}
            title="Saved sections"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Library className="h-3.5 w-3.5" />
            Sections
          </button>
          <button
            type="button"
            onClick={() => setPanel("revisions")}
            title="Revision history"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          <a
            href={editablePages.find((entry) => entry.id === page)?.path ?? "/"}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            View live
          </a>
          <button
            type="button"
            onClick={() => saveMutation.mutate(document)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => publishMutation.mutate(document)}
            disabled={publishMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {publishMutation.isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </header>

      {/* ------------------------------ workspace ---------------------------- */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <LeftPanel
          className={cn(
            "absolute inset-y-0 left-0 z-30 shadow-xl 2xl:static 2xl:z-auto 2xl:shadow-none",
            leftOpen ? "flex" : "hidden",
          )}
          root={document.root}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleVisible={(id) =>
            mutateRoot((root) =>
              updateElement(root, id, (element) => ({
                ...element,
                visibility: { ...element.visibility, base: element.visibility.base === false },
              })),
            )
          }
        />

        <BuilderCanvas
          root={document.root}
          breakpoint={breakpoint}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={moveElement}
          onInsert={insertWidget}
          onDuplicate={duplicate}
          onDelete={(id) => {
            mutateRoot((root) => removeElement(root, id));
            setSelectedId(null);
          }}
          onInlineEdit={(id, key, value) =>
            mutateRoot((root) =>
              updateElement(root, id, (element) => ({
                ...element,
                props: { ...element.props, [key]: value },
              })),
            )
          }
        />

        <Inspector
          className={cn(
            "absolute inset-y-0 right-0 z-30 shadow-xl 2xl:static 2xl:z-auto 2xl:shadow-none",
            rightOpen ? "flex" : "hidden",
          )}
          element={selected}
          breakpoint={breakpoint}
          onBreakpointChange={setBreakpoint}
          onUpload={handleUpload}
          onLabelChange={(label) =>
            selectedId &&
            mutateRoot((root) =>
              updateElement(root, selectedId, (element) => ({ ...element, label })),
            )
          }
          onPropChange={(key, value: JsonValue) =>
            selectedId &&
            mutateRoot((root) =>
              updateElement(root, selectedId, (element) => ({
                ...element,
                props: { ...element.props, [key]: value },
              })),
            )
          }
          onStyleChange={(target, key, value) =>
            selectedId &&
            mutateRoot((root) =>
              updateElement(root, selectedId, (element) => {
                const bag = { ...(element.style[target] ?? {}) };
                if (value) bag[key] = value;
                else delete bag[key];
                return { ...element, style: { ...element.style, [target]: bag } };
              }),
            )
          }
          onVisibilityChange={(target, visible) =>
            selectedId &&
            mutateRoot((root) =>
              updateElement(root, selectedId, (element) => ({
                ...element,
                visibility: { ...element.visibility, [target]: visible },
              })),
            )
          }
        />
      </div>

      {panel === "settings" ? (
        <PageSettingsModal document={document} onChange={commit} onClose={() => setPanel(null)} />
      ) : null}

      {panel === "revisions" ? (
        <RevisionsModal
          pageId={page}
          onRestore={(restored) => commit(restored)}
          onClose={() => setPanel(null)}
        />
      ) : null}

      {panel === "sections" ? (
        <SavedSectionsModal
          selected={selected}
          onInsert={(element) => {
            mutateRoot((root) =>
              insertElement(root, element, { parentId: null, index: root.length }),
            );
            setSelectedId(element.id);
          }}
          onClose={() => setPanel(null)}
        />
      ) : null}
    </div>
  );
}
