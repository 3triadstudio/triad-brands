import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Json } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canViewDashboard, getMyRole, requireAdmin } from "@/lib/access";
import { builderDocumentSchema, jsonValueSchema } from "@/lib/builder/types";
import { toBuilderDocument } from "@/lib/builder/migrate";
import { pageIdSchema } from "@/lib/page-editor";

/**
 * Page document CRUD for the visual builder.
 *
 * Drafts and published documents live in separate columns so editing never
 * touches the live site until Publish is pressed. Every publish also writes a
 * revision, which is what makes Restore possible.
 */

const pageInput = z.object({ pageId: pageIdSchema });

export const listBuilderPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await getMyRole(context);
    if (!canViewDashboard(role)) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("page_content")
      .select("page_id, draft_revision, published_revision, updated_at, published_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getBuilderPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => pageInput.parse(input))
  .handler(async ({ data, context }) => {
    const role = await getMyRole(context);
    if (!canViewDashboard(role)) throw new Error("Forbidden");

    const { data: row, error } = await context.supabase
      .from("page_content")
      .select("page_id, draft, published, draft_revision, published_revision, updated_at")
      .eq("page_id", data.pageId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    // A page with no row yet still opens — on the built-in default document.
    return {
      pageId: data.pageId,
      draft: toBuilderDocument(row?.draft, data.pageId),
      published: row?.published ? toBuilderDocument(row.published, data.pageId) : null,
      draftRevision: row?.draft_revision ?? 0,
      publishedRevision: row?.published_revision ?? 0,
      updatedAt: row?.updated_at ?? null,
    };
  });

export const saveBuilderDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ pageId: pageIdSchema, document: builderDocumentSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("page_content").upsert(
      {
        page_id: data.pageId,
        draft: data.document as unknown as Json,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publishBuilderPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ pageId: pageIdSchema, document: builderDocumentSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const document = data.document as unknown as Json;
    const now = new Date().toISOString();

    const { data: current } = await context.supabase
      .from("page_content")
      .select("published_revision")
      .eq("page_id", data.pageId)
      .maybeSingle();
    const revision = (current?.published_revision ?? 0) + 1;

    const { error: pageError } = await context.supabase.from("page_content").upsert(
      {
        page_id: data.pageId,
        draft: document,
        published: document,
        published_revision: revision,
        published_by: context.userId,
        updated_by: context.userId,
        updated_at: now,
        published_at: now,
      },
      { onConflict: "page_id" },
    );
    if (pageError) throw new Error(pageError.message);

    const { error: liveError } = await context.supabase
      .from("page_published_content")
      .upsert(
        { page_id: data.pageId, document, revision, published_at: now },
        { onConflict: "page_id" },
      );
    if (liveError) throw new Error(liveError.message);

    // Best-effort history: a failed revision write must not fail the publish.
    await context.supabase.from("page_content_revisions").insert({
      page_id: data.pageId,
      revision,
      document,
      created_by: context.userId,
    });

    return { ok: true, revision };
  });

export const unpublishBuilderPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => pageInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("page_published_content")
      .delete()
      .eq("page_id", data.pageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPageRevisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => pageInput.parse(input))
  .handler(async ({ data, context }) => {
    const role = await getMyRole(context);
    if (!canViewDashboard(role)) throw new Error("Forbidden");
    const { data: rows, error } = await context.supabase
      .from("page_content_revisions")
      .select("id, revision, created_at")
      .eq("page_id", data.pageId)
      .order("revision", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPageRevision = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ pageId: pageIdSchema, revision: z.number().int().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const role = await getMyRole(context);
    if (!canViewDashboard(role)) throw new Error("Forbidden");
    const { data: row, error } = await context.supabase
      .from("page_content_revisions")
      .select("document")
      .eq("page_id", data.pageId)
      .eq("revision", data.revision)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That revision no longer exists.");
    return toBuilderDocument(row.document, data.pageId);
  });

/* ------------------------------------------------------------------ */
/* Saved sections — reusable blocks across pages                       */
/* ------------------------------------------------------------------ */

export const listSavedSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await getMyRole(context);
    if (!canViewDashboard(role)) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("saved_sections")
      .select("id, name, document, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ name: z.string().min(1).max(120), document: jsonValueSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("saved_sections").insert({
      name: data.name,
      document: data.document as unknown as Json,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavedSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("saved_sections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
