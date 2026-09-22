/**
 * Drop-in replacement for `lucide-react/dynamic`.
 *
 * The installed lucide-react (0.575) predates the `/dynamic` subpath and its
 * `DynamicIcon`, but it does ship the full `icons` record. This shim rebuilds
 * the same small API — `DynamicIcon`, `IconName`, `iconNames` — over that record
 * so icon-by-name lookups work without bumping the dependency.
 */
/* eslint-disable react-refresh/only-export-components -- API shim, not a component module */
import type { ReactNode } from "react";
import { icons, type LucideProps } from "lucide-react";

/** Kebab-case icon name, e.g. "arrow-up-right". */
export type IconName = string;

const toKebab = (pascal: string) =>
  pascal
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])([0-9])/g, "$1-$2")
    .toLowerCase();

const toPascal = (kebab: string) =>
  kebab
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

/** Every icon name in kebab-case, sorted for stable picker ordering. */
export const iconNames: IconName[] = Object.keys(icons).map(toKebab).sort();

// Fast kebab -> component lookup built once.
const byKebab = new Map(Object.entries(icons).map(([pascal, comp]) => [toKebab(pascal), comp]));

export function DynamicIcon({
  name,
  fallback,
  ...props
}: { name: IconName; fallback?: () => ReactNode } & LucideProps) {
  const Icon = byKebab.get(name) ?? icons[toPascal(name) as keyof typeof icons];
  if (!Icon) return <>{fallback ? fallback() : <icons.Circle {...props} />}</>;
  return <Icon {...props} />;
}
