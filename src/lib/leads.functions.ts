import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(160).optional().default(""),
  service: z.string().trim().max(160).optional().default(""),
  starting_point: z.string().trim().max(160).optional().default(""),
  budget: z.string().trim().max(160).optional().default(""),
  timeline: z.string().trim().max(160).optional().default(""),
  details: z.string().trim().max(4000).optional().default(""),
});

export const submitLead = createServerFn({ method: "POST" })
  .validator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }) => {
    // Same fallback chain as the shared client (src/integrations/supabase/client.ts):
    // runtime server vars first, then the build-time VITE_ values. Without it,
    // a deployment that only defines the VITE_ names renders every page fine
    // but fails here — silently breaking the contact form in production.
    const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) {
      console.error("lead insert skipped: Supabase URL or publishable key is not configured");
      return { ok: false as const };
    }
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { error } = await supabase.from("leads").insert({
      name: data.name,
      email: data.email,
      company: data.company || null,
      service: data.service || null,
      starting_point: data.starting_point || null,
      budget: data.budget || null,
      timeline: data.timeline || null,
      details: data.details || null,
    });

    if (error) {
      console.error("lead insert failed", error.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
