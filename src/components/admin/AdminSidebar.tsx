import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, Menu, Search, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adminModules } from "@/components/admin/navigation";
import { logAdminInteraction } from "@/lib/storefront";

type AdminModule = (typeof adminModules)[number];

type AdminSidebarProps = {
  drawerOpen: boolean;
  onDrawerChange: (open: boolean) => void;
  onPaletteOpen: () => void;
  onProfileOpen: () => void;
  onSignOut: () => void;
  isAdmin: boolean | undefined;
  userId?: string | undefined;
};

function SidebarNavigation({
  onNavigate,
  mobile = false,
}: {
  onNavigate?: (() => void) | undefined;
  mobile?: boolean;
}) {
  return (
    <nav className="mt-3 space-y-1.5" aria-label="Admin navigation">
      {adminModules.map((module) => (
        <AdminNavLink key={module.to} module={module} onNavigate={onNavigate} mobile={mobile} />
      ))}
    </nav>
  );
}

function AdminNavLink({
  module,
  onNavigate,
  mobile,
}: {
  module: AdminModule;
  onNavigate?: (() => void) | undefined;
  mobile: boolean;
}) {
  const Icon = module.icon as LucideIcon;
  return (
    <Link
      to={module.to}
      onClick={() => {
        void logAdminInteraction({ label: module.label, category: "navigation" });
        onNavigate?.();
      }}
      activeOptions={{ exact: module.exact ?? false }}
      title={module.label}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white ${mobile ? "py-3" : "justify-center lg:justify-start"}`}
      activeProps={{
        className: `group flex items-center gap-3 rounded-xl border border-[#FF7A00]/30 bg-[#FF7A00]/10 px-3 ${mobile ? "py-3" : "py-2.5"} text-sm font-medium text-[#FFB45E] shadow-[0_0_24px_rgba(255,122,0,.12)]`,
      }}
    >
      <Icon
        className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
        aria-hidden="true"
      />
      <span className={mobile ? "" : "hidden lg:inline"}>{module.label}</span>
    </Link>
  );
}

function SidebarBrand({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${mobile ? "" : "justify-center lg:justify-start"}`}>
      <span
        className={`grid place-items-center rounded-xl bg-[#FF7A00] font-black text-[#101820] shadow-[0_8px_24px_rgba(255,122,0,.22)] ${mobile ? "h-9 w-9 text-sm" : "h-10 w-10 rounded-2xl text-lg"}`}
      >
        3
      </span>
      <div className={mobile ? "" : "hidden lg:block"}>
        <p className="text-sm font-semibold leading-tight tracking-tight">Triad Studio</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/40">Workspace</p>
      </div>
    </div>
  );
}

export function AdminSidebar({
  drawerOpen,
  onDrawerChange,
  onPaletteOpen,
  onProfileOpen,
  onSignOut,
  isAdmin,
  userId,
}: AdminSidebarProps) {
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDrawerChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, onDrawerChange]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#172033] focus:shadow-lg"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-[100svh] w-20 shrink-0 flex-col justify-between overflow-y-auto overscroll-contain border-r border-white/[0.08] bg-gradient-to-b from-[#101820] via-[#172B35] to-[#0B1116] p-3 text-white shadow-[18px_0_50px_rgba(16,24,32,.24)] backdrop-blur-xl md:flex lg:w-[280px] lg:p-5">
        <div>
          <SidebarBrand />
          <button
            type="button"
            onClick={onPaletteOpen}
            aria-label="Search modules"
            className="mt-5 flex min-h-11 w-full items-center justify-center rounded-2xl border border-white/[0.06] bg-white/5 px-3 py-3 text-xs text-white/60 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB45E] lg:justify-between"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Search</span>
            </span>
            <span className="hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] lg:inline">
              ⌘K
            </span>
          </button>
          <p className="mt-8 hidden px-3 text-[10px] uppercase tracking-[0.2em] text-white/35 lg:block">
            Workspace
          </p>
          <SidebarNavigation />
        </div>

        <div className="rounded-2xl bg-white/5 p-2 lg:p-3">
          <div className="flex items-center justify-center gap-3 lg:justify-start">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FF7A00] text-xs font-semibold text-[#101820]">
              TS
            </span>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-xs font-medium">
                {isAdmin ? "Super Admin" : "Signed in"}
              </p>
              <p className="truncate text-[10px] text-white/40">{userId?.slice(0, 12)}…</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              className="min-h-11 min-w-11 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB45E] lg:ml-auto"
            >
              <LogOut className="mx-auto h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:hidden">
        <SidebarBrand mobile />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPaletteOpen}
            aria-label="Search modules"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[#0E1331]/10 bg-white/70 text-[#0E1331] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onProfileOpen}
            aria-label="Edit profile"
            className="grid min-h-11 min-w-11 place-items-center rounded-full bg-[#0E1331] text-white transition-colors hover:bg-[#20284D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDrawerChange(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[#0E1331]/10 bg-white/70 text-[#0E1331] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => onDrawerChange(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            className="flex h-full w-[min(340px,88vw)] flex-col overscroll-contain border-r border-white/[0.08] bg-gradient-to-b from-[#101820] via-[#172B35] to-[#0B1116] p-5 text-white shadow-[18px_0_50px_rgba(16,24,32,.3)]"
            onClick={(event) => event.stopPropagation()}
            aria-label="Mobile admin navigation"
          >
            <div className="flex items-center justify-between">
              <SidebarBrand mobile />
              <button
                type="button"
                onClick={() => onDrawerChange(false)}
                aria-label="Close navigation"
                className="grid min-h-11 min-w-11 place-items-center rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB45E]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                onDrawerChange(false);
                onPaletteOpen();
              }}
              className="mt-7 flex min-h-11 w-full items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/5 px-3 py-3 text-left text-xs text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB45E]"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" /> Search modules…
            </button>
            <p className="mt-8 px-3 text-[10px] uppercase tracking-[0.2em] text-white/35">
              Workspace
            </p>
            <SidebarNavigation mobile onNavigate={() => onDrawerChange(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
