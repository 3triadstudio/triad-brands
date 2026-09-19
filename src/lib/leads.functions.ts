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
  .inputValidator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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
