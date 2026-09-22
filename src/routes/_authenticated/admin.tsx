import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { getAdminAccess, listWhatsappLeads } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { adminModules } from "@/components/admin/navigation";
import { roleLabels, type AppRole } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminShell,
});

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function AdminShell() {
  const accessFn = useServerFn(getAdminAccess);
  const leadsFn = useServerFn(listWhatsappLeads);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");

  const access = useQuery({ queryKey: ["admin-access"], queryFn: () => accessFn({}) });

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? ""));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? "");
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  const leads = useQuery({
    queryKey: ["admin-header-whatsapp-leads"],
    queryFn: () => leadsFn({}),
    refetchInterval: 60_000,
    enabled: access.data?.canViewDashboard === true,
  });

  useEffect(() => {
    if (!access.data?.canViewDashboard) return;
    const channel = supabase
      .channel("admin-header-whatsapp-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_leads" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-header-whatsapp-leads"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [access.data?.canViewDashboard, queryClient]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const pendingLeads = (
    (leads.data ?? []) as { id: string; name: string; product_title: string; status: string }[]
  ).filter((lead) => lead.status === "pending");
  const results = adminModules.filter((m) =>
    m.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const displayName = (email ? email.split("@")[0] : "") || "there";
  const today = new Date().toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="admin-shell min-h-screen overflow-x-hidden bg-[#F9FAFB] text-[#111827]">
      <div className="flex min-h-screen">
        <AdminSidebar
          drawerOpen={drawerOpen}
          onDrawerChange={setDrawerOpen}
          onPaletteOpen={() => setPaletteOpen(true)}
        />
        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 py-5 md:ml-20 md:px-8 md:py-7 lg:ml-64"
        >
          <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#111827]">
                {greetingForHour(new Date().getHours())}, {displayName}!
              </h1>
              <p className="mt-0.5 text-sm text-[#6B7280]">
                Here's what's happening with Triad Brands today
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#4B5563] lg:flex">
                {today}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  aria-label="Notifications"
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-[#E5E7EB] bg-white text-[#111827] shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
                >
                  <Bell className="h-4 w-4" />
                  {pendingLeads.length > 0 ? (
                    <span className="absolute right-1.5 top-1.5 grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-[#ED1D2B] px-1 text-[8px] font-bold text-white">
                      {pendingLeads.length > 9 ? "9+" : pendingLeads.length}
                    </span>
                  ) : null}
                </button>
                {notificationsOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3">
                      <p className="text-sm font-semibold text-[#111827]">Lead notifications</p>
                      <span className="rounded-full bg-[#FEF3C7] px-2 py-1 text-[10px] font-semibold text-[#92400E]">
                        {pendingLeads.length} pending
                      </span>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {pendingLeads.slice(0, 5).map((lead) => (
                        <Link
                          key={lead.id}
                          to="/admin/leads"
                          onClick={() => setNotificationsOpen(false)}
                          className="block border-b border-[#F3F4F6] px-4 py-3 hover:bg-[#F9FAFB]"
                        >
                          <p className="truncate text-xs font-semibold text-[#111827]">
                            {lead.name || "New inquiry"}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">
                            {lead.product_title || "WhatsApp lead"}
                          </p>
                        </Link>
                      ))}
                      {pendingLeads.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-[#9CA3AF]">
                          You're all caught up.
                        </p>
                      ) : null}
                    </div>
                    <Link
                      to="/admin/leads"
                      onClick={() => setNotificationsOpen(false)}
                      className="block bg-[#F9FAFB] px-4 py-3 text-center text-xs font-semibold text-[#ED1D2B] hover:bg-[#F3F4F6]"
                    >
                      Open lead inbox
                    </Link>
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white py-1 pl-1 pr-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#111827] text-xs font-semibold text-white">
                    {displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden="true" />
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xl">
                    <div className="border-b border-[#F3F4F6] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {email || "Signed in"}
                      </p>
                      <p className="mt-0.5 text-xs capitalize text-[#6B7280]">
                        {access.data?.role ? roleLabels[access.data.role as AppRole] : "No role"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#991B1B] hover:bg-[#FEF2F2]"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {access.isPending ? (
            <p className="text-sm text-[#6B7280]">Checking access…</p>
          ) : !access.data?.canViewDashboard ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold">No studio access yet</h2>
              <p className="mt-3 text-sm text-[#6B7280]">
                This account is signed in but doesn't have a role assigned. Share this ID with a
                Triad Brands administrator to be granted access:
              </p>
              <code className="mt-4 block break-all rounded-lg bg-[#F3F4F6] px-3 py-2 text-xs">
                {access.data?.userId}
              </code>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#111827]/50 p-6 pt-[12vh]"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-palette-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="command-palette-title" className="sr-only">
              Search admin modules
            </h2>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search admin modules"
              placeholder="Search modules…"
              className="w-full border-b border-[#F3F4F6] px-5 py-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ED1D2B]"
            />
            <ul className="max-h-72 overflow-auto p-2">
              {results.map((m) => (
                <li key={m.to}>
                  <button
                    type="button"
                    onClick={() => {
                      setPaletteOpen(false);
                      setQuery("");
                      navigate({ to: m.to });
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#111827] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ED1D2B]"
                  >
                    <m.icon className="h-4 w-4 text-[#6B7280]" />
                    {m.label}
                  </button>
                </li>
              ))}
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[#6B7280]">No matches</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
