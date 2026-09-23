import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { canViewDashboard, getMyRole } from "@/lib/access";

export const Route = createFileRoute("/_authenticated")({
  // The Supabase session lives in localStorage, which the server can't read.
  // Rendered server-side, this guard always saw "no user" and 307'd to /login,
  // so any hard refresh or direct link to an admin page bounced a signed-in
  // admin to the sign-in screen. Rendering the admin subtree client-only lets
  // the guard run where the session actually exists. (The admin is noindex, so
  // there is no SEO cost.)
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });

    // Staff are defined by the `user_roles` table, not by holding a session.
    // This is a fast client-side gate; the authoritative check is server-side
    // in `getAdminAccess`, which the shell renders a proper denial screen for.
    //
    // It deliberately fails OPEN: if the role lookup itself errors (offline,
    // RLS hiccup) we let the request through rather than destroying a valid
    // session. Only a definite "this account has no role" signs the user out.
    try {
      const role = await getMyRole({ supabase, userId: data.user.id });
      if (!canViewDashboard(role)) {
        await supabase.auth.signOut();
        throw redirect({ to: "/login" });
      }
      return { user: data.user, role };
    } catch (roleError) {
      if (isRedirect(roleError)) throw roleError;
      return { user: data.user, role: null };
    }
  },

  component: () => <Outlet />,
});
