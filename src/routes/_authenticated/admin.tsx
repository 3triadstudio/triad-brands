import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Bell, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { getAdminStatus } from "@/lib/admin.functions";
import { listWhatsappLeads } from "@/lib/cms.functions";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { adminModules } from "@/components/admin/navigation";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminShell,
});

function AdminShell() {
  const status = useServerFn(getAdminStatus);
  const listLeads = useServerFn(listWhatsappLeads);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { data, isPending } = useQuery({ queryKey: ["admin-status"], queryFn: () => status({}) });
  const leads = useQuery({
    queryKey: ["admin-header-whatsapp-leads"],
    queryFn: () => listLeads({}),
    refetchInterval: 60_000,
  });

  const leadRows = (leads.data ?? []) as {
    id: string;
    name: string | null;
    product_title: string | null;
    status: string;
    created_at: string;
  }[];
  const pendingLeads = leadRows.filter((lead) => lead.status === "pending");
  const displayName = profileName || (data?.isAdmin ? "Super Admin" : "Signed in");
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const hydrateUserProfile = (
      user: { user_metadata?: Record<string, unknown>; email?: string } | null,
    ) => {
      const meta = user?.user_metadata ?? {};
      const name =
        (typeof meta["display_name"] === "string" ? meta["display_name"] : "") ||
        (typeof meta["name"] === "string" ? meta["name"] : "") ||
        "";
      const avatar = typeof meta["avatar_url"] === "string" ? meta["avatar_url"] : "";
      setProfileName(name);
      setProfileAvatar(avatar);
      setUserEmail(user?.email || "");
    };

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      hydrateUserProfile(sessionData.session?.user ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateUserProfile(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-header-whatsapp-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_leads" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-header-whatsapp-leads"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
    navigate({ to: "/auth", replace: true });
  }

  async function saveProfile() {
    setProfileSaving(true);
    let avatarUrl = profileAvatar.trim();
    if (profileAvatarFile) {
      const userId = data?.userId;
      if (!userId) {
        setProfileSaving(false);
        toast.error("Could not identify your account");
        return;
      }
      const extension = profileAvatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `avatars/${userId}/profile.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(path, profileAvatarFile, {
          cacheControl: "3600",
          contentType: profileAvatarFile.type,
          upsert: true,
        });
      if (uploadError) {
        setProfileSaving(false);
        toast.error("Could not upload avatar");
        return;
      }
      const { data: publicUrl } = supabase.storage.from("site-assets").getPublicUrl(path);
      avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;
    }
    const { error } = await supabase.auth.updateUser({
      data: { display_name: profileName.trim(), avatar_url: avatarUrl },
    });
    setProfileSaving(false);
    if (error) {
      toast.error("Could not update profile");
      return;
    }
    setProfileAvatar(avatarUrl);
    setProfileAvatarFile(null);
    setProfileOpen(false);
    toast.success("Profile updated");
  }

  const results = adminModules.filter((m) =>
    m.label.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="admin-shell min-h-screen overflow-x-hidden bg-[#F5F7FA] text-[#172033] [background-image:linear-gradient(135deg,rgba(255,255,255,.75),rgba(239,244,248,.75))]">
      <Analytics />
      <div className="flex min-h-screen">
        <AdminSidebar
          drawerOpen={drawerOpen}
          onDrawerChange={setDrawerOpen}
          onPaletteOpen={() => setPaletteOpen(true)}
          onProfileOpen={() => setProfileOpen((open) => !open)}
          onSignOut={() => void signOut()}
          isAdmin={data?.isAdmin}
          userId={data?.userId}
        />

        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 py-5 md:ml-20 md:px-8 md:py-7 lg:ml-[280px]"
        >
          <div className="relative mb-6 hidden items-center justify-end gap-3 md:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Notifications"
                title="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-[#0E1331]/10 bg-white/75 text-[#0E1331] shadow-[0_8px_24px_rgba(14,19,49,0.04)] transition-colors hover:bg-white"
              >
                <Bell className="h-4 w-4" />
                {pendingLeads.length > 0 ? (
                  <span className="absolute right-1.5 top-1.5 grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-[#ED1D2B] px-1 text-[8px] font-bold text-white">
                    {pendingLeads.length > 9 ? "9+" : pendingLeads.length}
                  </span>
                ) : null}
              </button>
              {notificationsOpen ? (
                <div className="absolute right-0 top-12 z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#CBD3DF] bg-white shadow-[0_18px_50px_rgba(23,32,51,0.16)]">
                  <div className="flex items-center justify-between border-b border-[#0E1331]/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0E1331]">Lead notifications</p>
                      <p className="mt-1 text-[11px] text-[#94A3B8]">Live WhatsApp inquiries</p>
                    </div>
                    <span className="rounded-full bg-[#FFF3DE] px-2 py-1 text-[10px] font-semibold text-[#B56B10]">
                      {pendingLeads.length} pending
                    </span>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {pendingLeads.slice(0, 5).map((lead) => (
                      <Link
                        key={lead.id}
                        to="/admin/whatsapp"
                        onClick={() => setNotificationsOpen(false)}
                        className="block border-b border-[#0E1331]/[0.06] px-4 py-3 transition-colors hover:bg-[#F8F9F6]"
                      >
                        <p className="truncate text-xs font-semibold text-[#0E1331]">
                          {lead.name || "New inquiry"}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[#718096]">
                          {lead.product_title || "WhatsApp lead"}
                        </p>
                      </Link>
                    ))}
                    {pendingLeads.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-[#94A3B8]">
                        You are all caught up.
                      </p>
                    ) : null}
                  </div>
                  <Link
                    to="/admin/whatsapp"
                    onClick={() => setNotificationsOpen(false)}
                    className="block bg-[#F8F9F6] px-4 py-3 text-center text-xs font-semibold text-[#ED1D2B] hover:bg-[#F1F3EE]"
                  >
                    Open lead inbox
                  </Link>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Edit profile"
              className="flex items-center gap-2 rounded-full border border-[#0E1331]/10 bg-white/75 py-1.5 pl-1.5 pr-3 text-left shadow-[0_8px_24px_rgba(14,19,49,0.04)] transition-colors hover:bg-white"
            >
              {profileAvatar ? (
                <img src={profileAvatar} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0E1331] text-[10px] font-semibold text-white">
                  {initials || "TS"}
                </span>
              )}
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold leading-none text-[#0E1331]">{displayName}</p>
                <p className="mt-1 max-w-32 truncate text-[9px] leading-none text-[#94A3B8]">
                  {userEmail || "Triad Studio"}
                </p>
              </div>
              <ChevronDown className="ml-1 h-3.5 w-3.5 text-[#64748B]" />
            </button>
            {profileOpen ? (
              <div className="absolute right-8 top-16 z-40 w-80 rounded-2xl border border-[#0E1331]/10 bg-white p-4 shadow-[0_18px_50px_rgba(14,19,49,0.16)]">
                <div className="mb-4 flex items-center gap-3">
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#0E1331] text-sm font-semibold text-white">
                      {initials || "TS"}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#0E1331]">Edit your profile</p>
                    <p className="mt-1 text-[11px] text-[#94A3B8]">Saved to your account</p>
                  </div>
                </div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  Display name
                  <input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    placeholder="Your name"
                    className="mt-2 w-full rounded-xl border border-[#0E1331]/10 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#0E1331] outline-none focus:border-[#ED1D2B]"
                  />
                </label>
                <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  Avatar image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.size > 5 * 1024 * 1024) {
                        event.target.value = "";
                        toast.error("Avatar must be smaller than 5 MB");
                        return;
                      }
                      setProfileAvatarFile(file);
                      if (file) setProfileAvatar(URL.createObjectURL(file));
                    }}
                    className="mt-2 block w-full rounded-xl border border-dashed border-[#0E1331]/15 bg-[#F8F9F6] px-3 py-2.5 text-xs text-[#64748B] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0E1331] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                  <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-[#94A3B8]">
                    PNG, JPG, WEBP, or GIF up to 5 MB
                  </span>
                </label>
                <button
                  type="button"
                  disabled={profileSaving}
                  onClick={() => void saveProfile()}
                  className="mt-4 w-full rounded-xl bg-[#ED1D2B] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {profileSaving ? "Saving..." : "Save profile"}
                </button>
              </div>
            ) : null}
          </div>
          {profileOpen ? (
            <div className="fixed inset-x-4 top-20 z-40 rounded-2xl border border-[#0E1331]/10 bg-white p-4 shadow-[0_18px_50px_rgba(14,19,49,0.16)] md:hidden">
              <div className="mb-4 flex items-center gap-3">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#0E1331] text-sm font-semibold text-white">
                    {initials || "TS"}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#0E1331]">Edit your profile</p>
                  <p className="mt-1 text-[11px] text-[#94A3B8]">
                    {userEmail || "Saved to your account"}
                  </p>
                </div>
              </div>
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Display name"
                className="w-full rounded-xl border border-[#0E1331]/10 px-3 py-2.5 text-sm text-[#0E1331] outline-none focus:border-[#ED1D2B]"
              />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    event.target.value = "";
                    toast.error("Avatar must be smaller than 5 MB");
                    return;
                  }
                  setProfileAvatarFile(file);
                  if (file) setProfileAvatar(URL.createObjectURL(file));
                }}
                className="mt-3 block w-full rounded-xl border border-dashed border-[#0E1331]/15 bg-[#F8F9F6] px-3 py-2.5 text-xs text-[#64748B] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0E1331] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
              <button
                type="button"
                disabled={profileSaving}
                onClick={() => void saveProfile()}
                className="mt-3 w-full rounded-xl bg-[#ED1D2B] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          ) : null}
          {isPending ? (
            <p className="text-sm text-[#8A8A82]">Checking access…</p>
          ) : !data?.canAccessDashboard ? (
            <div className="rounded-2xl border border-[#0E1331]/10 bg-white p-8 shadow-[0_14px_35px_rgba(14,19,49,0.07)]">
              <h2 className="text-lg font-semibold">No admin access</h2>
              <p className="mt-3 text-sm text-[#64748B]">
                This account is signed in but does not have dashboard access yet. Share this user id
                with the studio owner to be granted access:
              </p>
              <code className="mt-4 block break-all rounded-lg bg-[#F1F1EE] px-3 py-2 text-xs">
                {data?.userId}
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
            className="w-full max-w-lg overflow-hidden rounded-xl border border-[#CBD3DF] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="command-palette-title" className="sr-only">
              Search admin modules
            </h2>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search admin modules"
              placeholder="Search modules, products, site text…"
              className="w-full border-b border-[#E2E7EF] px-5 py-4 text-sm text-[#172033] outline-none placeholder:text-[#64748B] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316]"
            />
            <ul className="max-h-72 overflow-auto p-2">
              {results.map((m) => (
                <li key={m.to}>
                  <button
                    type="button"
                    onClick={() => {
                      setPaletteOpen(false);
                      setQ("");
                      navigate({ to: m.to });
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#172033] transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316]"
                  >
                    <m.icon className="h-4 w-4 text-[#8A8A82]" />
                    {m.label}
                  </button>
                </li>
              ))}
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[#526079]">No matches</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
