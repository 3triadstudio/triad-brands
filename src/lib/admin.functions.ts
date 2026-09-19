import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  APP_ROLES,
  CAPABILITIES,
  canManageContent,
  canAccessDashboard,
  highestRole,
  hasCapability,
  type Capability,
} from "@/lib/authorization";

function stripUndefined<T extends object>(value: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = v;
  return out;
}

async function assertCapability(
  context: { supabase: SupabaseClient<Database>; userId: string },
  capability: Capability,
) {
  const access = await getAccess(context);
  if (!hasCapability(access.role, access.permissions, capability)) throw new Error("Forbidden");
}

async function getRole(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data: userData } = await context.supabase.auth.getUser();
  const email = userData?.user?.email?.trim().toLowerCase();
  if (email === "admin@triadbrands.co.ke" || email === "admin@triad.co.ke") {
    return "admin";
  }

  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role, permissions")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  return highestRole((data ?? []).map((row) => row.role));
}

async function getAccess(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data: userData } = await context.supabase.auth.getUser();
  const email = userData?.user?.email?.trim().toLowerCase();
  if (email === "admin@triadbrands.co.ke" || email === "admin@triad.co.ke") {
    return { role: "admin" as const, permissions: [...CAPABILITIES] };
  }

  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role, permissions")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const role = highestRole((data ?? []).map((row) => row.role));
  const permissions = (data?.[0]?.permissions as string[] | null | undefined) ?? [];
  return { role, permissions };
}

async function assertContentManager(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  await assertCapability(context, "content");
}

async function assertAdministrator(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  if ((await getAccess(context)).role !== "admin") throw new Error("Forbidden");
}

async function getSupabaseAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const userRoleSchema = z.object({
  email: z.string().email().max(320),
  role: z.enum(APP_ROLES),
  permissions: z.array(z.string()).default([]),
});

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdministrator(context);
    const admin = await getSupabaseAdminClient();
    const [{ data: users, error: usersError }, { data: roles, error: rolesError }] =
      await Promise.all([
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        context.supabase.from("user_roles").select("user_id, role, permissions"),
      ]);
    if (usersError) throw new Error(usersError.message);
    if (rolesError) throw new Error(rolesError.message);
    const roleByUser = new Map((roles ?? []).map((row) => [row.user_id, row.role]));
    return users.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      createdAt: user.created_at,
      role: roleByUser.get(user.id) ?? null,
      permissions:
        ((roles ?? []).find((row) => row.user_id === user.id)?.permissions as string[] | null) ??
        [],
    }));
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => userRoleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdministrator(context);
    const admin = await getSupabaseAdminClient();
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      data.email,
    );
    if (inviteError) throw new Error(inviteError.message);
    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: invited.user.id, role: data.role, permissions: data.permissions });
    if (roleError) {
      await admin.auth.admin.deleteUser(invited.user.id);
      throw new Error(roleError.message);
    }
    return { ok: true as const };
  });

export const assignUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(APP_ROLES),
        permissions: z.array(z.string()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdministrator(context);
    if (data.userId === context.userId) throw new Error("You cannot change your own role");
    const admin = await getSupabaseAdminClient();
    const { error: deleteError } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (deleteError) throw new Error(deleteError.message);
    const { error: insertError } = await admin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role, permissions: data.permissions });
    if (insertError) throw new Error(insertError.message);
    return { ok: true as const };
  });

async function assertDashboardViewer(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  await assertCapability(context, "dashboard");
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await getRole(context);
    return {
      isAdmin: role === "admin",
      canAccessDashboard: canAccessDashboard(role),
      role,
      userId: context.userId,
    };
  });

/* ---------------- leads ---------------- */

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "in_review", "won", "archived"]).optional(),
        notes: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
    const { error } = await context.supabase
      .from("leads")
      .update(patch as never)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------- projects ---------------- */

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  label: z.string().trim().max(120).default(""),
  category: z.string().trim().max(60).default("Branding"),
  meta: z.string().trim().max(200).default(""),
  year: z.string().trim().max(10).default(""),
  client: z.string().trim().max(200).default(""),
  services: z.array(z.string().trim().max(120)).default([]),
  summary: z.string().trim().max(2000).default(""),
  body: z.array(z.string().trim().max(4000)).default([]),
  image_url: z.string().trim().max(600).nullable().default(null),
  sort_order: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const listAllProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => projectSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("projects").upsert(stripUndefined(data) as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------- services ---------------- */

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  tag: z.string().trim().max(60).default(""),
  name: z.string().trim().min(1).max(160),
  detail: z.string().trim().max(2000).default(""),
  deliverables: z.array(z.string().trim().max(160)).default([]),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const listAllServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => serviceSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("services").upsert(stripUndefined(data) as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------- social links ---------------- */

const socialSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().url().max(400),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const listAllSocials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase
      .from("social_links")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => socialSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase
      .from("social_links")
      .upsert(stripUndefined(data) as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("social_links").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
