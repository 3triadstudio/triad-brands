import { Copy, GripVertical, Maximize2, Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";

import { RenderElement } from "@/components/builder/BuilderRenderer";
import { getWidget, widgetLabel } from "@/lib/builder/registry";
import { findTextNode, inlineEditableProp } from "@/lib/builder/inline";
import { documentCss, documentLayoutCss } from "@/lib/builder/style";
import type { BuilderElement, Breakpoint } from "@/lib/builder/types";
import { breakpointMeta } from "@/lib/builder/types";
import { cn } from "@/lib/utils";

export type DropTarget = { parentId: string | null; index: number };

/**
 * The editing canvas renders the real widgets — not a facsimile — so what the
 * client arranges is exactly what publishes. Selection chrome is layered on top
 * with outlines and a floating toolbar rather than by wrapping the markup,
 * which keeps the rendered DOM identical to production.
 */
export function BuilderCanvas({
  root,
  breakpoint,
  selectedId,
  onSelect,
  onMove,
  onInsert,
  onDuplicate,
  onDelete,
  onInlineEdit,
}: {
  root: BuilderElement[];
  breakpoint: Breakpoint;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, target: DropTarget) => void;
  onInsert: (type: string, target: DropTarget) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onInlineEdit: (id: string, key: string, value: string) => void;
}) {
  const [dropHint, setDropHint] = useState<DropTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingNode = useRef<HTMLElement | null>(null);

  /**
   * Inline editing works on the rendered DOM rather than a parallel input, so
   * the text keeps its real typography while being edited. On exit the node's
   * text is written straight back to the widget prop.
   */
  const commitInlineEdit = useCallback(() => {
    const node = editingNode.current;
    const id = editingId;
    editingNode.current = null;
    setEditingId(null);
    if (!node || !id) return;
    node.contentEditable = "false";
    const key = inlineEditableProp(node.dataset["builderTextType"] ?? "");
    if (key) onInlineEdit(id, key, node.textContent?.trim() ?? "");
  }, [editingId, onInlineEdit]);

  const beginInlineEdit = useCallback((element: BuilderElement, container: HTMLElement | null) => {
    const key = inlineEditableProp(element.type);
    if (!key || !container) return;
    const node = findTextNode(container);
    if (!node) return;
    node.dataset["builderTextType"] = element.type;
    node.contentEditable = "true";
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    editingNode.current = node;
    setEditingId(element.id);
  }, []);
  const widgetBodies = useRef<Record<string, HTMLDivElement | null>>({});

  // The canvas renders content at a fixed design width per breakpoint, then
  // scales the whole thing to fit the pane. This is what keeps a 1280px layout
  // legible inside a narrow editing column without clipping.
  const designWidth = DESIGN_WIDTH[breakpoint];
  const paneRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [paneWidth, setPaneWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fitToPane, setFitToPane] = useState(true);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) setPaneWidth(box.width);
    });
    observer.observe(pane);
    setPaneWidth(pane.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) setContentHeight(box.height);
    });
    observer.observe(content);
    setContentHeight(content.scrollHeight);
    return () => observer.disconnect();
  }, [root, breakpoint]);

  // Available width inside the pane's padding (24px each side).
  const available = Math.max(paneWidth - 48, 0);
  const fitScale = available > 0 ? Math.min(1, available / designWidth) : 1;
  const scale = fitToPane ? fitScale : zoom;
  const scaledWidth = designWidth * scale;
  const scaledHeight = contentHeight * scale;

  const applyZoom = (next: number) => {
    setFitToPane(false);
    setZoom(Math.min(2, Math.max(0.25, Number(next.toFixed(2)))));
  };
  const css = `${documentCss(root)}\n${documentLayoutCss(root)}`.trim();

  const handleDrop = (event: DragEvent, target: DropTarget) => {
    event.preventDefault();
    event.stopPropagation();
    setDropHint(null);
    const moveId = event.dataTransfer.getData("application/x-builder-move");
    if (moveId) {
      onMove(moveId, target);
      return;
    }
    const newType = event.dataTransfer.getData("application/x-builder-widget");
    if (newType) onInsert(newType, target);
  };

  const DropZone = ({ target, label }: { target: DropTarget; label?: string }) => {
    const active = dropHint?.parentId === target.parentId && dropHint?.index === target.index;
    return (
      <div
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDropHint(target);
        }}
        onDragLeave={() => setDropHint(null)}
        onDrop={(event) => handleDrop(event, target)}
        className={cn(
          "relative z-10 -my-1 flex h-3 items-center justify-center transition-all",
          active && "my-1 h-9",
        )}
      >
        <div
          className={cn(
            "h-0.5 w-full rounded-full transition-all",
            active ? "bg-accent" : "bg-transparent",
          )}
        />
        {active && label ? (
          <span className="absolute rounded bg-accent px-2 py-0.5 text-[0.65rem] font-medium text-accent-foreground">
            {label}
          </span>
        ) : null}
      </div>
    );
  };

  const renderNode = (element: BuilderElement, parentId: string | null, index: number) => {
    const definition = getWidget(element.type);
    const selected = selectedId === element.id;
    const hiddenHere = element.visibility[breakpoint] === false;

    return (
      <div key={element.id} className="relative">
        <DropZone target={{ parentId, index }} />
        <div
          role="presentation"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(element.id);
          }}
          className={cn(
            "relative rounded-sm outline-offset-2 transition-[outline-color]",
            selected ? "outline outline-2 outline-accent" : "outline outline-1 outline-transparent",
            "hover:outline-accent/40",
            hiddenHere && "opacity-40",
          )}
        >
          {selected ? (
            <div className="absolute -top-7 left-0 z-20 flex items-center gap-1 rounded-md bg-accent px-1.5 py-1 text-[0.65rem] font-medium text-accent-foreground">
              <span
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-builder-move", element.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                className="cursor-grab active:cursor-grabbing"
                title="Drag to move"
              >
                <GripVertical className="h-3 w-3" />
              </span>
              {widgetLabel(element)}
              {hiddenHere ? <span className="opacity-70">· hidden</span> : null}
              {inlineEditableProp(element.type) && editingId !== element.id ? (
                <span className="opacity-70">· double-click to edit</span>
              ) : null}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate(element.id);
                }}
                title="Duplicate"
                className="ml-1 opacity-80 hover:opacity-100"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(element.id);
                }}
                title="Delete"
                className="opacity-80 hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : null}

          {definition?.container ? (
            <div className="min-h-[3rem]">
              <RenderShell element={element}>
                {element.children.length === 0 ? (
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDropHint({ parentId: element.id, index: 0 });
                    }}
                    onDrop={(event) => handleDrop(event, { parentId: element.id, index: 0 })}
                    className={cn(
                      "grid min-h-[5rem] place-items-center rounded-lg border-2 border-dashed text-xs text-muted-foreground transition-colors",
                      dropHint?.parentId === element.id
                        ? "border-accent text-accent"
                        : "border-border",
                    )}
                  >
                    Drop a widget here
                  </div>
                ) : (
                  <>
                    {element.children.map((child, childIndex) =>
                      renderNode(child, element.id, childIndex),
                    )}
                    <DropZone target={{ parentId: element.id, index: element.children.length }} />
                  </>
                )}
              </RenderShell>
            </div>
          ) : (
            <div
              ref={(node) => {
                if (selected) widgetBodies.current[element.id] = node;
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                beginInlineEdit(element, widgetBodies.current[element.id] ?? null);
              }}
              onBlur={() => {
                if (editingId === element.id) commitInlineEdit();
              }}
              onKeyDown={(event) => {
                if (editingId !== element.id) return;
                if (event.key === "Escape" || (event.key === "Enter" && !event.shiftKey)) {
                  event.preventDefault();
                  commitInlineEdit();
                }
              }}
              className={cn(editingId === element.id ? "cursor-text" : "pointer-events-none")}
            >
              <RenderElement element={element} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-muted/40">
      <div
        ref={paneRef}
        className="min-h-0 flex-1 overflow-auto p-6"
        onClick={() => onSelect(null)}
        role="presentation"
      >
        {/* The sizer box takes the SCALED dimensions so the pane scrolls
            correctly — a CSS transform doesn't change layout size on its own. */}
        <div
          className="mx-auto"
          style={{ width: scaledWidth || "100%", height: scaledHeight || undefined }}
        >
          <div
            ref={contentRef}
            className="bg-background shadow-sm"
            style={{
              width: `${designWidth}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
            <div className="cms-theme-live p-4">
              {root.length === 0 ? (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropHint({ parentId: null, index: 0 });
                  }}
                  onDrop={(event) => handleDrop(event, { parentId: null, index: 0 })}
                  className={cn(
                    "grid min-h-[24rem] place-items-center rounded-xl border-2 border-dashed text-sm text-muted-foreground",
                    dropHint ? "border-accent text-accent" : "border-border",
                  )}
                >
                  Drag a section from the left to start this page
                </div>
              ) : (
                <>
                  {root.map((element, index) => renderNode(element, null, index))}
                  <DropZone target={{ parentId: null, index: root.length }} label="Add here" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom controls, floating bottom-centre. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/95 px-1.5 py-1 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={() => applyZoom(scale - 0.1)}
            aria-label="Zoom out"
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyZoom(1)}
            className="min-w-[3rem] rounded-full px-2 text-center text-xs font-medium tabular-nums hover:bg-muted"
            title="Reset to 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={() => applyZoom(scale + 0.1)}
            aria-label="Zoom in"
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="mx-0.5 h-4 w-px bg-border" />
          <button
            type="button"
            onClick={() => setFitToPane(true)}
            aria-pressed={fitToPane}
            title="Fit to screen"
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors",
              fitToPane ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Fit
          </button>
        </div>
      </div>
    </div>
  );
}

/** Fixed authoring width per breakpoint; the canvas scales this to fit. */
const DESIGN_WIDTH: Record<Breakpoint, number> = {
  base: 1280,
  tablet: 768,
  mobile: 390,
};

/**
 * Container widgets render their own wrapper so layout props (flex direction,
 * grid columns, section width) apply while their children stay individually
 * selectable.
 */
function RenderShell({
  element,
  children,
}: {
  element: BuilderElement;
  children: React.ReactNode;
}) {
  if (element.type === "section") {
    return <div data-builder-id={element.id}>{children}</div>;
  }
  return (
    <div data-builder-id={element.id} className="min-h-[3rem]">
      {children}
    </div>
  );
}
