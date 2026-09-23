import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getMyRole, canViewDashboard, requireAdmin, APP_ROLES, type AppRole } from "@/lib/access";

/* ---------------------------------------------------------------------- */
/* Access                                                                  */
/* ---------------------------------------------------------------------- */

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await getMyRole(context);
    return {
      userId: context.userId,
      role,
      canViewDashboard: canViewDashboard(role),
      isAdmin: role === "admin",
    };
  });

/* ---------------------------------------------------------------------- */
/* Dashboard metrics                                                      */
/* ---------------------------------------------------------------------- */

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ days: z.number().int().min(7).max(90).default(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const role = await getMyRole(context);
    if (!canViewDashboard(role)) throw new Error("Forbidden");
    const sb = context.supabase;
    const since = new Date(Date.now() - data.days * 24 * 3600 * 1000).toISOString();

    const results = await Promise.all([
      sb.from("click_events").select("kind, category, created_at").gte("created_at", since),
      sb.from("leads").select("status, created_at").gte("created_at", since),
      sb.from("whatsapp_leads").select("status, created_at").gte("created_at", since),
      sb.from("products").select("id, active"),
    ]);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    const [clicks, leads, waLeads, products] = results;

    const clickRows = (clicks.data ?? []) as {
      kind: string;
      category: string;
      created_at: string;
    }[];
    const leadRows = (leads.data ?? []) as { status: string; created_at: string }[];
    const waRows = (waLeads.data ?? []) as { status: string; created_at: string }[];

    const byCategory = new Map<string, number>();
    for (const c of clickRows) {
      if (!c.category) continue;
      byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + 1);
    }
    const topCategory =
      [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0] ?? (["—", 0] as [string, number]);

    const totalLeads = leadRows.length + waRows.length;
    const won =
      leadRows.filter((l) => l.status === "won").length +
      waRows.filter((l) => l.status === "fulfilled").length;

    const dateKey = (t: string) => t.slice(0, 10);
    const clicksByDay = new Map<string, number>();
    for (const c of clickRows)
      clicksByDay.set(dateKey(c.created_at), (clicksByDay.get(dateKey(c.created_at)) ?? 0) + 1);
    const leadsByDay = new Map<string, number>();
    for (const l of leadRows)
      leadsByDay.set(dateKey(l.created_at), (leadsByDay.get(dateKey(l.created_at)) ?? 0) + 1);
    for (const l of waRows)
      leadsByDay.set(dateKey(l.created_at), (leadsByDay.get(dateKey(l.created_at)) ?? 0) + 1);
    const velocity: { day: string; clicks: number; leads: number }[] = [];
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      velocity.push({
        day: key.slice(5),
        clicks: clicksByDay.get(key) ?? 0,
        leads: leadsByDay.get(key) ?? 0,
      });
    }

    return {
      totalClicks: clickRows.length,
      totalLeads,
      pendingLeads: waRows.filter((l) => l.status === "pending").length,
      conversionRate: totalLeads ? Math.round((won / totalLeads) * 100) : 0,
      topCategory: { name: topCategory[0], count: topCategory[1] },
      activeProducts: ((products.data ?? []) as { active: boolean }[]).filter((p) => p.active)
        .length,
      velocity,
    };
  });

/* ---------------------------------------------------------------------- */
/* Asset uploads (shared)                                                 */
/* ---------------------------------------------------------------------- */

const uploadSchema = z.object({
  folder: z.enum(["products", "hero-slides", "branding", "media"]),
  filename: z.string().min(1).max(180),
  contentType: z.string().regex(/^image\//),
  base64: z.string().min(1).max(7_000_000),
});

export const uploadAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => uploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const extension =
      data.filename
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${data.folder}/${crypto.randomUUID()}.${extension}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error } = await context.supabase.storage
      .from("site-assets")
      .upload(path, bytes.buffer, { contentType: data.contentType, cacheControl: "3600" });
    if (error) throw new Error(error.message);
    const { data: publicUrl } = context.supabase.storage.from("site-assets").getPublicUrl(path);
    return { publicUrl: publicUrl.publicUrl, path };
  });

export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ folder: z.enum(["products", "hero-slides", "branding", "media"]).default("media") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const role = await getMyRole(context);
    if (!canViewDashboard(role)) throw new Error("Forbidden");
    const { data: files, error } = await context.supabase.storage
      .from("site-assets")
      .list(data.folder, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw new Error(error.message);
    return (files ?? [])
      .filter((file) => file.id)
      .map((file) => {
        const path = `${data.folder}/${file.name}`;
        const { data: publicUrl } = context.supabase.storage.from("site-assets").getPublicUrl(path);
        return {
          path,
          name: file.name,
          url: publicUrl.publicUrl,
          size: (file.metadata?.["size"] as number | undefined) ?? 0,
          createdAt: file.created_at ?? "",
        };
      });
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.storage.from("site-assets").remove([data.path]);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------- */
/* Catalog (products)                                                     */
/* ---------------------------------------------------------------------- */

const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  sku: z.string().trim().max(80).default(""),
  subtitle: z.string().trim().max(300).default(""),
  description: z.string().trim().max(4000).default(""),
  category: z.string().trim().min(1).max(80),
  badges: z.array(z.string().trim().max(60)).default([]),
  price_from: z.number().min(0).default(0),
  sale_price: z.number().min(0).nullable().default(null),
  stock_quantity: z.number().int().min(0).default(0),
  image_url: z.string().trim().max(600).nullable().default(null),
  images: z.array(z.string().trim().max(600)).default([]),
  whatsapp_payload: z.string().trim().max(2000).default(""),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!canViewDashboard(await getMyRole(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("products").upsert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------- */
/* Hero slides                                                            */
/* ---------------------------------------------------------------------- */

const slideSchema = z.object({
  id: z.string().uuid().optional(),
  eyebrow: z.string().trim().max(80).default(""),
  headline: z.string().trim().min(1).max(160),
  subtext: z.string().trim().max(400).default(""),
  cta_label: z.string().trim().max(60).default("Start a project"),
  cta_href: z.string().trim().max(300).default("/contact"),
  image_url: z.string().trim().max(600).nullable().default(null),
  overlay_opacity: z.number().min(0).max(100).default(60),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const listHeroSlides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!canViewDashboard(await getMyRole(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("hero_slides")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => slideSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("hero_slides").upsert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("hero_slides").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------- */
/* Work (projects)                                                        */
/* ---------------------------------------------------------------------- */

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
    if (!canViewDashboard(await getMyRole(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => projectSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("projects").upsert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------- */
/* Services                                                               */
/* ---------------------------------------------------------------------- */

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
    if (!canViewDashboard(await getMyRole(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => serviceSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("services").upsert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------- */
/* Social links                                                           */
/* ---------------------------------------------------------------------- */

const socialSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().url().max(400),
  icon_key: z.string().trim().max(60).default("globe"),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const listAllSocialLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!canViewDashboard(await getMyRole(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("social_links")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => socialSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("social_links").upsert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("social_links").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------- */
/* Site settings                                                          */
/* ---------------------------------------------------------------------- */

export const getSiteSettingsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!canViewDashboard(await getMyRole(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase.from("site_settings").select("key, value");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveSiteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ key: z.string().trim().min(1).max(80), value: z.unknown() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: data.key, value: data.value } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------- */
/* Leads (form + WhatsApp)                                                */
/* ---------------------------------------------------------------------- */

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!canViewDashboard(await getMyRole(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "in_review", "won", "archived"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("leads")
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listWhatsappLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!canViewDashboard(await getMyRole(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("whatsapp_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateWhatsappLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "quoted", "art_proof_sent", "fulfilled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("whatsapp_leads")
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteWhatsappLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("whatsapp_leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------- */
/* Users & roles (admin only, uses the Supabase Auth Admin API)           */
/* ---------------------------------------------------------------------- */

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: users, error: usersError }, { data: roles, error: rolesError }] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        context.supabase.from("user_roles").select("user_id, role"),
      ]);
    if (usersError) throw new Error(usersError.message);
    if (rolesError) throw new Error(rolesError.message);
    const roleByUser = new Map((roles ?? []).map((row) => [row.user_id, row.role]));
    return users.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      createdAt: user.created_at,
      role: (roleByUser.get(user.id) as AppRole | undefined) ?? null,
    }));
  });

const inviteSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(APP_ROLES),
});

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => inviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
    );
    if (inviteError) throw new Error(inviteError.message);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: invited.user.id, role: data.role });
    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(invited.user.id);
      throw new Error(roleError.message);
    }
    return { ok: true as const };
  });

const assignRoleSchema = z.object({ userId: z.string().uuid(), role: z.enum(APP_ROLES) });

export const assignUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => assignRoleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot change your own role.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (deleteError) throw new Error(deleteError.message);
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (insertError) throw new Error(insertError.message);
    return { ok: true as const };
  });
