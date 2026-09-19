import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pageDocumentSchema, pageIdSchema } from "@/lib/page-editor";
import type { Database } from "@/integrations/supabase/types";
import {
  canManageContent,
  canAccessDashboard,
  hasCapability,
  highestRole,
  type Capability,
} from "@/lib/authorization";

async function getRole(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role, permissions")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  return highestRole((data ?? []).map((row) => row.role));
}

async function assertCapability(
  context: { supabase: SupabaseClient<Database>; userId: string },
  capability: Capability,
) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role, permissions")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const role = highestRole((data ?? []).map((row) => row.role));
  const permissions = (data?.[0]?.permissions as string[] | null | undefined) ?? [];
  if (!hasCapability(role, permissions, capability)) throw new Error("Forbidden");
}

async function assertContentManager(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  await assertCapability(context, "content");
}

async function getAccess(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role, permissions")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const role = highestRole((data ?? []).map((row) => row.role));
  const permissions = (data?.[0]?.permissions as string[] | null | undefined) ?? [];
  return { role, permissions };
}

async function assertDashboardViewer(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  await assertCapability(context, "dashboard");
}

async function assertAdministrator(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  const access = await getAccess(context);
  if (access.role !== "admin") throw new Error("Forbidden");
}

/* ---------------- overview metrics ---------------- */

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ days: z.number().int().min(7).max(90).default(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertDashboardViewer(context);
    const sb = context.supabase;
    const since = new Date(Date.now() - data.days * 24 * 3600 * 1000).toISOString();

    const results = await Promise.all([
      sb.from("click_events").select("kind, category, created_at").gte("created_at", since),
      sb.from("leads").select("status, created_at").gte("created_at", since),
      sb.from("whatsapp_leads").select("status, created_at").gte("created_at", since),
      sb.from("products").select("id, active"),
    ]);
    const failedResult = results.find(({ error }) => error);
    if (failedResult?.error) throw new Error(failedResult.error.message);
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

    // 7-day velocity buckets (oldest → newest)
    const days: { day: string; clicks: number; leads: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const next = new Date(d.getTime() + 86400000);
      const inRange = (t: string) => {
        const ts = new Date(t).getTime();
        return ts >= d.getTime() && ts < next.getTime();
      };
      days.push({
        day: d.toISOString().slice(5, 10),
        clicks: clickRows.filter((c) => inRange(c.created_at)).length,
        leads:
          leadRows.filter((l) => inRange(l.created_at)).length +
          waRows.filter((l) => inRange(l.created_at)).length,
      });
    }

    return {
      totalClicks: clickRows.length,
      whatsappClicks: clickRows.filter((c) => c.kind === "whatsapp").length,
      telClicks: clickRows.filter((c) => c.kind === "tel").length,
      totalLeads,
      pendingLeads: waRows.filter((l) => l.status === "pending").length,
      conversionRate: totalLeads ? Math.round((won / totalLeads) * 100) : 0,
      topCategory: { name: topCategory[0], count: topCategory[1] },
      activeProducts: ((products.data ?? []) as { active: boolean }[]).filter((p) => p.active)
        .length,
      velocity: days,
    };
  });

type VercelAnalyticsCount = {
  data?: { pageviews?: number; visitors?: number };
};

type VercelAnalyticsAggregate = {
  data?: Array<Record<string, unknown>>;
};

type VercelBreakdown = { label: string; value: number };

function getVercelAnalyticsConfig() {
  const token = process.env["VERCEL_ACCESS_TOKEN"] || process.env["VERCEL_API_TOKEN"];
  const projectId = process.env["VERCEL_PROJECT_ID"];
  const teamId = process.env["VERCEL_TEAM_ID"];
  const slug = process.env["VERCEL_TEAM_SLUG"];
  return { token, projectId, teamId, slug };
}

function getVercelMetric(row: Record<string, unknown>) {
  const value = row["value"] ?? row["pageviews"] ?? row["visitors"] ?? row["count"];
  return typeof value === "number" ? value : Number(value ?? 0) || 0;
}

function getVercelBreakdown(
  rows: Array<Record<string, unknown>>,
  dimension: string,
): VercelBreakdown[] {
  return rows
    .map((row) => ({
      label: String(row[dimension] ?? row["key"] ?? row["name"] ?? "Unknown"),
      value: getVercelMetric(row),
    }))
    .filter((row) => row.value > 0)
    .slice(0, 5);
}

export const getVercelAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDashboardViewer(context);
    const { token, projectId, teamId, slug } = getVercelAnalyticsConfig();
    if (!token || !projectId) {
      return { configured: false as const, reason: "missing_configuration" as const };
    }

    const until = new Date();
    const since = new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      projectId,
      since: since.toISOString(),
      until: until.toISOString(),
    });
    if (teamId) params.set("teamId", teamId);
    if (slug) params.set("slug", slug);

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const countResponse = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/count?${params.toString()}`,
      { headers },
    );
    if (!countResponse.ok) {
      const detail = await countResponse.text();
      throw new Error(`Vercel Analytics request failed (${countResponse.status}): ${detail}`);
    }

    const fetchAggregate = async (by: string, limit: number) => {
      const aggregateParams = new URLSearchParams(params);
      aggregateParams.set("by", by);
      aggregateParams.set("limit", String(limit));
      const response = await fetch(
        `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${aggregateParams.toString()}`,
        { headers },
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Vercel Analytics ${by} request failed (${response.status}): ${detail}`);
      }
      return (await response.json()) as VercelAnalyticsAggregate;
    };

    const [aggregate, pages, referrers, devices] = await Promise.all([
      fetchAggregate("day", 31),
      fetchAggregate("requestPath", 5),
      fetchAggregate("referrerHostname", 5),
      fetchAggregate("deviceType", 5),
    ]);

    const count = (await countResponse.json()) as VercelAnalyticsCount;
    const trend = (aggregate.data ?? [])
      .map((row) => ({
        day: String(row["timestamp"] ?? row["date"] ?? "").slice(0, 10),
        pageviews: getVercelMetric(row),
      }))
      .filter((row) => row.day);

    return {
      configured: true as const,
      pageviews: count.data?.pageviews ?? 0,
      visitors: count.data?.visitors ?? 0,
      trend,
      topPages: getVercelBreakdown(pages.data ?? [], "requestPath"),
      referrers: getVercelBreakdown(referrers.data ?? [], "referrerHostname"),
      devices: getVercelBreakdown(devices.data ?? [], "deviceType"),
      since: since.toISOString(),
      until: until.toISOString(),
    };
  });

/* ---------------- settings ---------------- */

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase.from("site_settings").select("key, value");
    if (error) throw new Error(error.message);
    type SiteSettingValue =
      string | number | boolean | null | SiteSettingValue[] | { [key: string]: SiteSettingValue };
    const out: Record<string, SiteSettingValue> = {};
    for (const row of (data ?? []) as { key: string; value: SiteSettingValue }[]) {
      out[row.key] = row.value;
    }
    return out;
  });

export const saveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ key: z.string().min(1).max(60), value: z.unknown() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: data.key, value: data.value } as never, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------- visual page documents ---------------- */

export const getPageDocument = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ pageId: pageIdSchema }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { data: row, error } = await context.supabase
      .from("page_content")
      .select(
        "page_id, draft, published, draft_revision, published_revision, updated_at, published_at",
      )
      .eq("page_id", data.pageId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });

export const savePageDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        document: pageDocumentSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { data: existing, error: readError } = await context.supabase
      .from("page_content")
      .select("draft_revision")
      .eq("page_id", data.document.pageId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    const nextRevision = ((existing?.draft_revision as number | undefined) ?? 0) + 1;
    const { error } = await context.supabase.from("page_content").upsert({
      page_id: data.document.pageId,
      draft: data.document,
      draft_revision: nextRevision,
      updated_by: context.userId,
    } as never);
    if (error) throw new Error(error.message);
    const revisionTable = (context.supabase as any).from("page_content_revisions");
    const { error: revisionError } = await revisionTable.upsert(
      {
        page_id: data.document.pageId,
        revision: nextRevision,
        document: data.document,
        created_by: context.userId,
      },
      { onConflict: "page_id,revision" },
    );
    if (revisionError) throw new Error(revisionError.message);
    return { ok: true as const, revision: nextRevision };
  });

export const duplicatePageDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ sourcePageId: pageIdSchema, targetPageId: pageIdSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { data: source, error: sourceError } = await context.supabase
      .from("page_content")
      .select("draft")
      .eq("page_id", data.sourcePageId)
      .maybeSingle();
    if (sourceError) throw new Error(sourceError.message);
    if (!source?.draft) throw new Error("Source page draft not found");
    const document = { ...(source.draft as Record<string, unknown>), pageId: data.targetPageId };
    const { error } = await context.supabase.from("page_content").upsert({
      page_id: data.targetPageId,
      draft: document,
      published: document,
      draft_revision: 1,
      published_revision: 1,
      updated_by: context.userId,
      published_by: context.userId,
      published_at: new Date().toISOString(),
    } as never);
    if (error) throw new Error(error.message);
    const { error: publishedError } = await context.supabase
      .from("page_published_content")
      .upsert({ page_id: data.targetPageId, document, revision: 1 } as never);
    if (publishedError) throw new Error(publishedError.message);
    return { ok: true as const };
  });

export const listSavedSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await (context.supabase as any)
      .from("saved_sections")
      .select("id, name, document, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveSavedSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(120),
        document: pageDocumentSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { id, ...rest } = data;
    const row = id
      ? { id, ...rest, created_by: context.userId }
      : { ...rest, created_by: context.userId };
    const { error } = await (context.supabase.from("saved_sections" as any) as any).upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteSavedSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await (context.supabase.from("saved_sections" as any) as any)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listPageRevisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ pageId: pageIdSchema }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { data: revisions, error } = await (context.supabase as any)
      .from("page_content_revisions")
      .select("id, page_id, revision, created_at")
      .eq("page_id", data.pageId)
      .order("revision", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (revisions ?? []) as Array<{ id: string; revision: number; created_at: string }>;
  });

export const restorePageRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pageId: pageIdSchema, revision: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { data: revision, error: readError } = await (context.supabase as any)
      .from("page_content_revisions")
      .select("document")
      .eq("page_id", data.pageId)
      .eq("revision", data.revision)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!revision?.document) throw new Error("Revision not found");
    const { data: current, error: currentError } = await context.supabase
      .from("page_content")
      .select("draft_revision")
      .eq("page_id", data.pageId)
      .maybeSingle();
    if (currentError) throw new Error(currentError.message);
    const nextRevision = ((current?.draft_revision as number | undefined) ?? 0) + 1;
    const { error } = await context.supabase.from("page_content").upsert({
      page_id: data.pageId,
      draft: revision.document,
      draft_revision: nextRevision,
      updated_by: context.userId,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const, revision: nextRevision };
  });

export const publishPageDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        document: pageDocumentSchema,
        expectedRevision: z.number().int().positive().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { data: existing, error: readError } = await context.supabase
      .from("page_content")
      .select("draft_revision")
      .eq("page_id", data.document.pageId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    const revision = (existing?.draft_revision as number | undefined) ?? 0;
    if (data.expectedRevision !== undefined && data.expectedRevision !== revision) {
      throw new Error("This page changed in another session. Reload the draft before publishing.");
    }
    const { error } = await context.supabase.from("page_content").upsert({
      page_id: data.document.pageId,
      draft: data.document,
      published: data.document,
      draft_revision: revision || 1,
      published_revision: revision || 1,
      updated_by: context.userId,
      published_by: context.userId,
      published_at: new Date().toISOString(),
    } as never);
    if (error) throw new Error(error.message);
    const { error: publishedError } = await context.supabase.from("page_published_content").upsert({
      page_id: data.document.pageId,
      document: data.document,
      revision: revision || 1,
      published_at: new Date().toISOString(),
    } as never);
    if (publishedError) throw new Error(publishedError.message);
    return { ok: true as const, revision: revision || 1 };
  });

export const uploadSiteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: z.enum(["logo", "favicon", "media"]),
        filename: z.string().min(1).max(180),
        contentType: z.string().regex(/^image\//),
        base64: z.string().min(1).max(7_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const extension =
      data.filename
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "png";
    const folder = data.kind === "media" ? "media" : "branding";
    const path = `${folder}/${data.kind}-${crypto.randomUUID()}.${extension}`;
    const bytes = Uint8Array.from(atob(data.base64), (character) => character.charCodeAt(0));
    const { error } = await context.supabase.storage
      .from("site-assets")
      .upload(path, bytes.buffer, {
        contentType: data.contentType,
        cacheControl: "3600",
      });
    if (error) throw new Error(error.message);
    const { data: publicUrl } = context.supabase.storage.from("site-assets").getPublicUrl(path);
    return { publicUrl: publicUrl.publicUrl };
  });

export const replaceSiteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        path: z.string().min(1).max(500),
        contentType: z.string().regex(/^image\//),
        base64: z.string().min(1).max(7_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdministrator(context);
    const bytes = Uint8Array.from(atob(data.base64), (character) => character.charCodeAt(0));
    const { error } = await context.supabase.storage
      .from("site-assets")
      .upload(data.path, bytes.buffer, {
        contentType: data.contentType,
        cacheControl: "3600",
        upsert: true,
      });
    if (error) throw new Error(error.message);
    const { data: publicUrl } = context.supabase.storage
      .from("site-assets")
      .getPublicUrl(data.path);
    return { publicUrl: `${publicUrl.publicUrl}?v=${Date.now()}` };
  });

export const listSiteAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdministrator(context);
    const folders = ["branding", "products", "media"];
    const results = await Promise.all(
      folders.map((folder) =>
        context.supabase.storage.from("site-assets").list(folder, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        }),
      ),
    );
    const failed = results.find((result: { error?: { message: string } | null }) => result.error);
    if (failed?.error) throw new Error(failed.error.message);
    return results.flatMap((result, folderIndex) =>
      (result.data ?? [])
        .filter((file: any) => file.name)
        .map((file: any) => {
          const path = `${folders[folderIndex]}/${file.name}`;
          const { data: publicUrl } = context.supabase.storage
            .from("site-assets")
            .getPublicUrl(path);
          return {
            id: file.id ?? path,
            path,
            publicUrl: publicUrl.publicUrl,
            createdAt: file.created_at ?? null,
          };
        }),
    );
  });

export const deleteSiteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdministrator(context);
    const [
      { data: products, error: productsError },
      { data: settings, error: settingsError },
      { data: pages, error: pagesError },
    ] = await Promise.all([
      context.supabase.from("products").select("image_url, images"),
      context.supabase.from("site_settings").select("value"),
      context.supabase.from("page_content").select("draft, published"),
    ]);
    if (productsError || settingsError || pagesError) {
      throw new Error(productsError?.message ?? settingsError?.message ?? pagesError?.message);
    }
    const referenced = [products, settings, pages]
      .flatMap((rows: any) => rows ?? [])
      .some((row: any) => JSON.stringify(row).includes(data.path));
    if (referenced) throw new Error("This media asset is still in use and cannot be deleted.");
    const { error } = await context.supabase.storage.from("site-assets").remove([data.path]);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------- page sections ---------------- */

export const listSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase
      .from("page_sections")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        heading: z.string().max(300).optional(),
        subheading: z.string().max(600).optional(),
        is_visible: z.boolean().optional(),
        sort_order: z.number().int().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
    const { error } = await (context.supabase.from("page_sections") as any)
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------- hero slides ---------------- */

const slideSchema = z.object({
  id: z.string().uuid().optional(),
  eyebrow: z.string().trim().max(160).default(""),
  headline: z.string().trim().max(200).default(""),
  subtext: z.string().trim().max(600).default(""),
  cta_label: z.string().trim().max(80).default("Request Custom Quote"),
  cta_href: z.string().trim().max(300).default("#quote"),
  image_url: z.string().trim().max(600).nullable().default(null),
  overlay_opacity: z.number().int().min(0).max(100).default(60),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const listSlides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase
      .from("hero_slides")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => slideSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { id, ...fields } = data;
    const row = id ? { id, ...fields } : fields;
    const { error } = await context.supabase.from("hero_slides").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const uploadHeroSlideImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z.string().min(1).max(180),
        contentType: z.string().regex(/^image\//),
        base64: z.string().min(1).max(7_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const extension =
      data.filename
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "png";
    const path = `hero-slides/${crypto.randomUUID()}.${extension}`;
    const bytes = Uint8Array.from(atob(data.base64), (character) => character.charCodeAt(0));
    const { error } = await context.supabase.storage
      .from("site-assets")
      .upload(path, bytes.buffer, {
        contentType: data.contentType,
        cacheControl: "3600",
      });
    if (error) throw new Error(error.message);
    const { data: publicUrl } = context.supabase.storage.from("site-assets").getPublicUrl(path);
    return { publicUrl: publicUrl.publicUrl };
  });

export const deleteSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("hero_slides").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------- products ---------------- */

const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  sku: z.string().trim().max(80).default(""),
  subtitle: z.string().trim().max(400).default(""),
  description: z.string().trim().max(4000).default(""),
  category: z.string().trim().max(80).default("Apparel"),
  badges: z.array(z.string().trim().max(80)).default([]),
  price_from: z.number().int().min(0).default(0),
  sale_price: z.number().int().min(0).nullable().default(null),
  stock_quantity: z.number().int().min(0).default(0),
  image_url: z.string().trim().max(600).nullable().default(null),
  images: z.array(z.string().trim().max(600)).default([]),
  whatsapp_payload: z.string().trim().max(800).default(""),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z.string().min(1).max(180),
        contentType: z.string().regex(/^image\//),
        base64: z.string().min(1).max(7_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const extension =
      data.filename
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "png";
    const path = `products/${crypto.randomUUID()}.${extension}`;
    const bytes = Uint8Array.from(atob(data.base64), (character) => character.charCodeAt(0));
    const { error } = await context.supabase.storage
      .from("site-assets")
      .upload(path, bytes.buffer, {
        contentType: data.contentType,
        cacheControl: "3600",
      });
    if (error) throw new Error(error.message);
    const { data: publicUrl } = context.supabase.storage.from("site-assets").getPublicUrl(path);
    return { publicUrl: publicUrl.publicUrl };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { id, ...fields } = data;
    const row = id ? { id, ...fields } : fields;
    const { error } = await context.supabase.from("products").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------- whatsapp leads ---------------- */

export const listWhatsappLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContentManager(context);
    const { data, error } = await context.supabase
      .from("whatsapp_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateWhatsappLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "quoted", "art_proof_sent", "fulfilled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase
      .from("whatsapp_leads")
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteWhatsappLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertContentManager(context);
    const { error } = await context.supabase.from("whatsapp_leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
