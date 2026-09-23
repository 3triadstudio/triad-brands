// Thin app-level mirror of the database's `has_capability` / `has_role`
// checks (see supabase/migrations). RLS is the real enforcement — this just
// lets the UI ask "should I show this?" and "why did that write just fail?"
// with a friendly answer instead of a raw Postgres error.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const APP_ROLES = ["admin", "editor", "author", "contributor", "subscriber"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrator",
  editor: "Editor",
  author: "Author",
  contributor: "Contributor",
  subscriber: "Subscriber",
};

/** Any role with dashboard access at all — writes still gate on `admin` via RLS. */
export function canViewDashboard(role: AppRole | null) {
  return role === "admin" || role === "editor" || role === "author" || role === "contributor";
}

export async function getMyRole(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}): Promise<AppRole | null> {
  // A user may hold more than one role row (the table is unique on
  // user_id+role, not user_id), so fetch them all and report the strongest.
  // `.maybeSingle()` would throw the moment someone was granted two roles.
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);

  const held = new Set((data ?? []).map((row) => row.role as AppRole));
  return APP_ROLES.find((role) => held.has(role)) ?? null;
}

export async function requireAdmin(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  const role = await getMyRole(context);
  if (role !== "admin") throw new Error("Forbidden: this action requires the Administrator role.");
}
