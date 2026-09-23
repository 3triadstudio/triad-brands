import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { FieldControl, ControlLabel } from "@/components/builder/FieldControls";
import { inputClass } from "@/components/admin/ui";
import { getWidget, widgetLabel } from "@/lib/builder/registry";
import { styleControls } from "@/lib/builder/style";
import {
  BREAKPOINTS,
  breakpointMeta,
  type BuilderElement,
  type Breakpoint,
  type JsonValue,
  type StyleBag,
} from "@/lib/builder/types";
import { cn } from "@/lib/utils";

type Tab = "content" | "style" | "advanced";

/**
 * The inspector is fully generic: it reads the selected widget's field groups
 * from the registry and renders controls for them. Adding a widget never
 * requires touching this file.
 */
export function Inspector({
  element,
  breakpoint,
  onBreakpointChange,
  onPropChange,
  onStyleChange,
  onVisibilityChange,
  onLabelChange,
  onUpload,
  className = "",
}: {
  element: BuilderElement | null;
  breakpoint: Breakpoint;
  onBreakpointChange: (next: Breakpoint) => void;
  onPropChange: (key: string, value: JsonValue) => void;
  onStyleChange: (breakpoint: Breakpoint, key: string, value: string) => void;
  onVisibilityChange: (breakpoint: Breakpoint, visible: boolean) => void;
  onLabelChange: (label: string) => void;
  onUpload?: (file: File) => Promise<string>;
  className?: string;
}) {
  const [tab, setTab] = useState<Tab>("content");

  if (!element) {
    return (
      <aside
        className={cn("w-[20rem] shrink-0 border-l border-border bg-background p-5", className)}
      >
        <p className="text-sm text-muted-foreground">
          Select anything on the page to edit its content, styling and visibility.
        </p>
      </aside>
    );
  }

  const definition = getWidget(element.type);
  const styleBag: StyleBag = element.style[breakpoint] ?? {};
  const visible = element.visibility[breakpoint] !== false;

  return (
    <aside
      className={cn(
        "flex w-[20rem] shrink-0 flex-col border-l border-border bg-background",
        className,
      )}
    >
      <div className="border-b border-border p-4">
        <p className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
          {definition?.label ?? element.type}
        </p>
        <input
          value={element.label ?? ""}
          onChange={(event) => onLabelChange(event.target.value)}
          placeholder={widgetLabel(element)}
          className={cn(inputClass, "mt-2")}
          aria-label="Layer name"
        />
      </div>

      <div className="flex border-b border-border">
        {(["content", "style", "advanced"] as const).map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => setTab(candidate)}
            className={cn(
              "flex-1 border-b-2 px-3 py-2.5 text-xs font-medium capitalize transition-colors",
              tab === candidate
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {candidate}
          </button>
        ))}
      </div>

      {/* Style and visibility are per-breakpoint, so the switcher lives with them. */}
      {tab !== "content" ? (
        <div className="flex gap-1 border-b border-border p-2">
          {BREAKPOINTS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => onBreakpointChange(candidate)}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs transition-colors",
                breakpoint === candidate
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {breakpointMeta[candidate].label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {tab === "content" ? (
          definition?.fields.length ? (
            definition.fields.map((group) => (
              <section key={group.label} className="space-y-3">
                <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground">
                  {group.label}
                </h3>
                {group.fields.map((field) => (
                  <FieldControl
                    key={field.key}
                    field={field}
                    value={element.props[field.key] ?? null}
                    onChange={(next) => onPropChange(field.key, next)}
                    {...(onUpload ? { onUpload } : {})}
                  />
                ))}
              </section>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              This widget has no content settings. Use the Style tab to change how it looks.
            </p>
          )
        ) : null}

        {tab === "style" ? (
          <>
            <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Editing{" "}
              <strong className="text-foreground">{breakpointMeta[breakpoint].label}</strong>
              {breakpoint === "base"
                ? ". These values apply everywhere unless overridden."
                : ". Overrides desktop at this size and below."}
            </p>
            {styleControls.map((group) => (
              <section key={group.label} className="space-y-3">
                <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground">
                  {group.label}
                </h3>
                {group.controls.map((control) => {
                  const raw = styleBag[control.key] ?? "";
                  if ("type" in control && control.type === "color") {
                    return (
                      <FieldControl
                        key={control.key}
                        field={{ kind: "color", key: control.key, label: control.label }}
                        value={raw}
                        onChange={(next) =>
                          onStyleChange(
                            breakpoint,
                            control.key,
                            typeof next === "string" ? next : "",
                          )
                        }
                      />
                    );
                  }
                  const unit = "unit" in control ? control.unit : "px";
                  const numeric = Number.parseFloat(raw);
                  return (
                    <div key={control.key}>
                      <ControlLabel>{control.label}</ControlLabel>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={"max" in control ? control.max : 200}
                          step={"step" in control ? control.step : 1}
                          value={Number.isFinite(numeric) ? numeric : 0}
                          onChange={(event) =>
                            onStyleChange(breakpoint, control.key, `${event.target.value}${unit}`)
                          }
                          className="flex-1 accent-[var(--accent)]"
                        />
                        <input
                          value={raw}
                          onChange={(event) =>
                            onStyleChange(breakpoint, control.key, event.target.value)
                          }
                          placeholder="auto"
                          className={cn(inputClass, "w-24 shrink-0 text-xs")}
                        />
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}
          </>
        ) : null}

        {tab === "advanced" ? (
          <>
            <section className="space-y-3">
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground">
                Visibility
              </h3>
              <p className="text-xs text-muted-foreground">
                Hide this element on specific screen sizes without deleting it.
              </p>
              {BREAKPOINTS.map((candidate) => {
                const shown = element.visibility[candidate] !== false;
                return (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => onVisibilityChange(candidate, !shown)}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>{breakpointMeta[candidate].label}</span>
                    {shown ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" /> Visible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
                        <EyeOff className="h-3.5 w-3.5" /> Hidden
                      </span>
                    )}
                  </button>
                );
              })}
            </section>

            <section className="space-y-2">
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground">
                Element ID
              </h3>
              <p className="rounded-md bg-muted/60 px-3 py-2 font-mono text-xs text-muted-foreground">
                {element.id}
              </p>
              <p className="text-xs text-muted-foreground">
                Use this as a scroll-to anchor target from any button.
              </p>
            </section>
          </>
        ) : null}
      </div>
    </aside>
  );
}
