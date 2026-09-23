/**
 * Field definitions describe how a widget's props are edited.
 *
 * The inspector renders these generically, so adding a new control to a widget
 * is a data change here rather than new UI code. This is what keeps "everything
 * is editable" from turning into a bespoke form per widget.
 */
import type { JsonValue } from "@/lib/builder/types";

export type FieldDef =
  | { kind: "text"; key: string; label: string; placeholder?: string; help?: string }
  | { kind: "textarea"; key: string; label: string; rows?: number; placeholder?: string }
  | { kind: "richtext"; key: string; label: string }
  | { kind: "link"; key: string; label: string }
  | { kind: "image"; key: string; label: string; help?: string }
  | { kind: "icon"; key: string; label: string }
  | { kind: "color"; key: string; label: string }
  | { kind: "toggle"; key: string; label: string; help?: string }
  | { kind: "number"; key: string; label: string; min?: number; max?: number; step?: number }
  | {
      kind: "select";
      key: string;
      label: string;
      options: ReadonlyArray<{ value: string; label: string }>;
    }
  | {
      kind: "repeater";
      key: string;
      label: string;
      itemLabel: string;
      max?: number;
      fields: ReadonlyArray<FieldDef>;
    };

export type FieldGroup = {
  label: string;
  fields: ReadonlyArray<FieldDef>;
};

/** Reads a possibly-missing prop with a typed fallback. */
export function propValue<T>(props: Record<string, JsonValue>, key: string, fallback: T): T {
  const value = props[key];
  return (value === undefined || value === null ? fallback : value) as T;
}

export function propString(props: Record<string, JsonValue>, key: string, fallback = ""): string {
  const value = props[key];
  return typeof value === "string" ? value : fallback;
}

export function propBoolean(props: Record<string, JsonValue>, key: string, fallback = false) {
  const value = props[key];
  return typeof value === "boolean" ? value : fallback;
}

export function propNumber(props: Record<string, JsonValue>, key: string, fallback = 0) {
  const value = props[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function propList(
  props: Record<string, JsonValue>,
  key: string,
): Array<Record<string, JsonValue>> {
  const value = props[key];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, JsonValue> =>
      typeof item === "object" && item !== null && !Array.isArray(item),
  );
}
