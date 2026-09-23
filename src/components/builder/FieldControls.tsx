import { useState } from "react";
import { ChevronDown, GripVertical, Images, Plus, Trash2, Upload } from "lucide-react";

import { inputClass } from "@/components/admin/ui";
import { AssetPicker } from "@/components/builder/AssetPicker";
import type { FieldDef } from "@/lib/builder/fields";
import { propString } from "@/lib/builder/fields";
import { iconNames, iconRegistry } from "@/lib/builder/icons";
import { emptyLink, type JsonValue, type LinkValue } from "@/lib/builder/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </span>
  );
}

function ToggleControl({
  value,
  onChange,
  label,
  help,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-1.5">
      <span>
        <span className="text-sm text-foreground">{label}</span>
        {help ? <span className="mt-0.5 block text-xs text-muted-foreground">{help}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors",
          value ? "border-accent bg-accent" : "border-border bg-muted",
        )}
      >
        <span
          className={cn(
            "block h-4 w-4 rounded-full bg-background transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

/** Colour control that accepts both a swatch and a raw value (tokens, rgba). */
function ColorControl({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const isHex = /^#[0-9a-f]{3,8}$/i.test(value);
  return (
    <div>
      <ControlLabel>{label}</ControlLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHex ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
          aria-label={`${label} swatch`}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="var(--accent)"
          className={inputClass}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

function IconControl({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const Selected = iconRegistry[value];
  return (
    <div>
      <ControlLabel>{label}</ControlLabel>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(inputClass, "flex items-center justify-between gap-2 text-left")}
      >
        <span className="flex items-center gap-2">
          {Selected ? <Selected className="h-4 w-4" aria-hidden="true" /> : null}
          {value || "None"}
        </span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>
      {open ? (
        <div className="mt-2 grid max-h-52 grid-cols-6 gap-1 overflow-y-auto rounded-lg border border-border bg-background p-2">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="col-span-6 rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
          >
            No icon
          </button>
          {iconNames.map((name) => {
            const Icon = iconRegistry[name];
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  "grid h-9 place-items-center rounded hover:bg-muted",
                  value === name && "bg-accent/15 text-accent",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Link control: destination plus the non-navigation actions. */
function LinkControl({
  value,
  onChange,
  label,
}: {
  value: LinkValue;
  onChange: (next: LinkValue) => void;
  label: string;
}) {
  const actions = [
    { value: "navigate", label: "Go to a page or URL" },
    { value: "start_project", label: "Open the project brief" },
    { value: "whatsapp", label: "Open WhatsApp" },
    { value: "scroll_to", label: "Scroll to an anchor" },
  ] as const;
  return (
    <div className="rounded-lg border border-border p-3">
      <ControlLabel>{label}</ControlLabel>
      <select
        value={value.action}
        onChange={(event) =>
          onChange({ ...value, action: event.target.value as LinkValue["action"] })
        }
        className={inputClass}
      >
        {actions.map((action) => (
          <option key={action.value} value={action.value}>
            {action.label}
          </option>
        ))}
      </select>
      {value.action === "navigate" || value.action === "scroll_to" ? (
        <input
          value={value.href}
          onChange={(event) => onChange({ ...value, href: event.target.value })}
          placeholder={value.action === "scroll_to" ? "#section-id" : "/about or https://…"}
          className={cn(inputClass, "mt-2")}
        />
      ) : null}
      {value.action === "navigate" ? (
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={value.target === "_blank"}
            onChange={(event) =>
              onChange({ ...value, target: event.target.checked ? "_blank" : "_self" })
            }
          />
          Open in a new tab
        </label>
      ) : null}
    </div>
  );
}

/** Image control with upload, URL entry and preview. */
function ImageControl({
  value,
  onChange,
  label,
  help,
  onUpload,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
  help?: string;
  onUpload?: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  return (
    <div>
      {picking ? (
        <AssetPicker
          onPick={onChange}
          onClose={() => setPicking(false)}
          {...(onUpload ? { onUpload } : {})}
        />
      ) : null}
      <ControlLabel>{label}</ControlLabel>
      {value ? (
        <img
          src={value}
          alt=""
          className="mb-2 h-24 w-full rounded-lg border border-border object-cover"
        />
      ) : null}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://… or /image.jpg"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setPicking(true)}
          title="Browse the media library"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs hover:bg-muted"
        >
          <Images className="h-3.5 w-3.5" />
          Library
        </button>
        {onUpload ? (
          <label
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-xs",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            {busy ? "…" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  onChange(await onUpload(file));
                } finally {
                  setBusy(false);
                  event.target.value = "";
                }
              }}
            />
          </label>
        ) : null}
      </div>
      {help ? <p className="mt-1 text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field dispatcher                                                    */
/* ------------------------------------------------------------------ */

export function FieldControl({
  field,
  value,
  onChange,
  onUpload,
}: {
  field: FieldDef;
  value: JsonValue;
  onChange: (next: JsonValue) => void;
  onUpload?: (file: File) => Promise<string>;
}) {
  switch (field.kind) {
    case "text":
      return (
        <div>
          <ControlLabel>{field.label}</ControlLabel>
          <input
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder ?? ""}
            className={inputClass}
          />
          {field.help ? <p className="mt-1 text-xs text-muted-foreground">{field.help}</p> : null}
        </div>
      );

    case "textarea":
      return (
        <div>
          <ControlLabel>{field.label}</ControlLabel>
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            rows={field.rows ?? 3}
            placeholder={field.placeholder ?? ""}
            className={cn(inputClass, "resize-y")}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <ControlLabel>{field.label}</ControlLabel>
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );

    case "number":
      return (
        <div>
          <ControlLabel>{field.label}</ControlLabel>
          <input
            type="number"
            value={typeof value === "number" ? value : ""}
            min={field.min ?? undefined}
            max={field.max ?? undefined}
            step={field.step ?? 1}
            onChange={(event) =>
              onChange(event.target.value === "" ? 0 : Number(event.target.value))
            }
            className={inputClass}
          />
        </div>
      );

    case "toggle":
      return (
        <ToggleControl
          value={value === true}
          onChange={onChange}
          label={field.label}
          {...(field.help ? { help: field.help } : {})}
        />
      );

    case "color":
      return (
        <ColorControl
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          label={field.label}
        />
      );

    case "icon":
      return (
        <IconControl
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          label={field.label}
        />
      );

    case "link":
      return (
        <LinkControl
          value={
            value && typeof value === "object" && !Array.isArray(value)
              ? ({ ...emptyLink, ...(value as unknown as LinkValue) } as LinkValue)
              : emptyLink
          }
          onChange={(next) => onChange(next as unknown as JsonValue)}
          label={field.label}
        />
      );

    case "image":
      return (
        <ImageControl
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          label={field.label}
          {...(field.help ? { help: field.help } : {})}
          {...(onUpload ? { onUpload } : {})}
        />
      );

    case "richtext":
      return (
        <div>
          <ControlLabel>{field.label}</ControlLabel>
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            rows={6}
            className={cn(inputClass, "resize-y font-mono text-xs")}
          />
        </div>
      );

    case "repeater":
      return (
        <RepeaterControl
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          {...(onUpload ? { onUpload } : {})}
        />
      );

    default:
      return null;
  }
}

function RepeaterControl({
  field,
  value,
  onChange,
  onUpload,
}: {
  field: Extract<FieldDef, { kind: "repeater" }>;
  value: JsonValue[];
  onChange: (next: JsonValue) => void;
  onUpload?: (file: File) => Promise<string>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = value.filter(
    (item): item is Record<string, JsonValue> =>
      typeof item === "object" && item !== null && !Array.isArray(item),
  );

  const update = (next: Record<string, JsonValue>[]) => onChange(next as unknown as JsonValue);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    update(next);
  };

  return (
    <div>
      <ControlLabel>{field.label}</ControlLabel>
      <div className="space-y-2">
        {items.map((item, index) => {
          const open = openIndex === index;
          const title =
            propString(item, "title") ||
            propString(item, "label") ||
            propString(item, "text") ||
            propString(item, "question") ||
            propString(item, "value") ||
            `${field.itemLabel} ${index + 1}`;
          return (
            <div key={index} className="rounded-lg border border-border">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex-1 truncate text-left text-sm"
                >
                  {title}
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="px-1 text-xs text-muted-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === items.length - 1}
                  className="px-1 text-xs text-muted-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => update(items.filter((_, i) => i !== index))}
                  className="px-1 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${field.itemLabel}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {open ? (
                <div className="space-y-3 border-t border-border p-3">
                  {field.fields.map((child) => (
                    <FieldControl
                      key={child.key}
                      field={child}
                      value={item[child.key] ?? null}
                      onChange={(next) =>
                        update(
                          items.map((candidate, i) =>
                            i === index ? { ...candidate, [child.key]: next } : candidate,
                          ),
                        )
                      }
                      {...(onUpload ? { onUpload } : {})}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          if (field.max && items.length >= field.max) return;
          update([...items, {}]);
          setOpenIndex(items.length);
        }}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-accent hover:text-accent"
      >
        <Plus className="h-3.5 w-3.5" />
        Add {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}
