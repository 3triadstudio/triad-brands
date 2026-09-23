import { useState } from "react";
import { ChevronRight, Eye, EyeOff, Layers, Plus } from "lucide-react";

import { iconRegistry } from "@/lib/builder/icons";
import { widgetCategories, widgetDefinitions, widgetLabel } from "@/lib/builder/registry";
import type { BuilderElement } from "@/lib/builder/types";
import { cn } from "@/lib/utils";

function WidgetIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconRegistry[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}

export function LeftPanel({
  root,
  selectedId,
  onSelect,
  onToggleVisible,
  className = "",
}: {
  root: BuilderElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  className?: string;
}) {
  const [mode, setMode] = useState<"widgets" | "layers">("widgets");

  return (
    <aside
      className={cn(
        "flex w-[17rem] shrink-0 flex-col border-r border-border bg-background",
        className,
      )}
    >
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setMode("widgets")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
            mode === "widgets"
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          Widgets
        </button>
        <button
          type="button"
          onClick={() => setMode("layers")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
            mode === "layers"
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          Layers
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {mode === "widgets" ? (
          <div className="space-y-5">
            {widgetCategories.map((category) => {
              const widgets = widgetDefinitions.filter((widget) => widget.category === category.id);
              if (!widgets.length) return null;
              return (
                <section key={category.id}>
                  <h3 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {category.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {widgets.map((widget) => (
                      <div
                        key={widget.type}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("application/x-builder-widget", widget.type);
                          event.dataTransfer.effectAllowed = "copy";
                        }}
                        title={widget.detail}
                        className="flex cursor-grab flex-col items-center gap-1.5 rounded-lg border border-border px-2 py-3 text-center transition-colors hover:border-accent hover:bg-accent/5 active:cursor-grabbing"
                      >
                        <WidgetIcon name={widget.icon} className="h-4 w-4 text-accent" />
                        <span className="text-[0.7rem] leading-tight">{widget.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <LayerTree
            elements={root}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            onToggleVisible={onToggleVisible}
          />
        )}
      </div>
    </aside>
  );
}

function LayerTree({
  elements,
  depth,
  selectedId,
  onSelect,
  onToggleVisible,
}: {
  elements: BuilderElement[];
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!elements.length && depth === 0) {
    return <p className="text-xs text-muted-foreground">This page has no sections yet.</p>;
  }

  return (
    <ul className="space-y-0.5">
      {elements.map((element) => {
        const hasChildren = element.children.length > 0;
        const isCollapsed = collapsed[element.id];
        const hidden = element.visibility.base === false;
        return (
          <li key={element.id}>
            <div
              className={cn(
                "group flex items-center gap-1 rounded-md px-1.5 py-1.5 text-xs transition-colors",
                selectedId === element.id ? "bg-accent/15 text-accent" : "hover:bg-muted",
              )}
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((current) => ({ ...current, [element.id]: !current[element.id] }))
                  }
                  className="shrink-0"
                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                >
                  <ChevronRight
                    className={cn("h-3 w-3 transition-transform", !isCollapsed && "rotate-90")}
                  />
                </button>
              ) : (
                <span className="w-3 shrink-0" />
              )}
              <button
                type="button"
                onClick={() => onSelect(element.id)}
                className={cn("flex-1 truncate text-left", hidden && "line-through opacity-50")}
              >
                {widgetLabel(element)}
              </button>
              <button
                type="button"
                onClick={() => onToggleVisible(element.id)}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={hidden ? "Show" : "Hide"}
              >
                {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
            {hasChildren && !isCollapsed ? (
              <LayerTree
                elements={element.children}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                onToggleVisible={onToggleVisible}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
