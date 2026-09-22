import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adminModules, adminNavGroups } from "@/components/admin/navigation";

type AdminModule = (typeof adminModules)[number];

export function AdminSidebar({
  drawerOpen,
  onDrawerChange,
  onPaletteOpen,
}: {
  drawerOpen: boolean;
  onDrawerChange: (open: boolean) => void;
  onPaletteOpen: () => void;
}) {
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#111827] focus:shadow-lg"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-[100svh] w-20 shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-[#E5E7EB] bg-white p-3 md:flex lg:w-64 lg:p-5">
        <SidebarBrand />
        <button
          type="button"
          onClick={onPaletteOpen}
          aria-label="Search modules"
          className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-xs text-[#6B7280] transition-colors hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B] lg:justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Search</span>
          </span>
          <span className="hidden rounded-md bg-[#E5E7EB] px-1.5 py-0.5 text-[10px] text-[#4B5563] lg:inline">
            ⌘K
          </span>
        </button>
        <SidebarNavigation />
      </aside>

      <div className="mb-5 flex items-center justify-between gap-3 md:hidden">
        <SidebarBrand mobile />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPaletteOpen}
            aria-label="Search modules"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDrawerChange(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => onDrawerChange(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            className="flex h-full w-[min(300px,88vw)] flex-col overflow-y-auto overscroll-contain border-r border-[#E5E7EB] bg-white p-5"
            onClick={(event) => event.stopPropagation()}
            aria-label="Mobile admin navigation"
          >
            <div className="flex items-center justify-between">
              <SidebarBrand mobile />
              <button
                type="button"
                onClick={() => onDrawerChange(false)}
                aria-label="Close navigation"
                className="grid min-h-11 min-w-11 place-items-center rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <SidebarNavigation mobile onNavigate={() => onDrawerChange(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarBrand({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${mobile ? "" : "justify-center lg:justify-start"}`}>
      <span
        className={`grid shrink-0 place-items-center rounded-lg bg-[#111827] font-black text-white ${mobile ? "h-8 w-8 text-sm" : "h-8 w-8 text-sm"}`}
      >
        T
      </span>
      <p
        className={`text-[15px] font-semibold tracking-tight text-[#111827] ${mobile ? "" : "hidden lg:block"}`}
      >
        Triad Brands
      </p>
    </div>
  );
}

function SidebarNavigation({
  onNavigate,
  mobile = false,
}: {
  onNavigate?: (() => void) | undefined;
  mobile?: boolean;
}) {
  return (
    <nav className="mt-7 space-y-5" aria-label="Admin navigation">
      {adminNavGroups.map((group, index) => (
        <div key={group.label} className={index > 0 ? "border-t border-[#F3F4F6] pt-5" : ""}>
          <p
            className={`mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF] ${mobile ? "" : "hidden lg:block"}`}
          >
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.modules.map((module) => (
              <AdminNavLink
                key={module.to}
                module={module}
                onNavigate={onNavigate}
                mobile={mobile}
              />
            ))}
          </div>
        </div>
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
      onClick={() => onNavigate?.()}
      activeOptions={{ exact: Boolean(module.exact) }}
      title={module.label}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827] ${mobile ? "py-3" : "justify-center lg:justify-start"}`}
      activeProps={{
        className: `group flex items-center gap-3 rounded-xl bg-[#111827] px-3 ${mobile ? "py-3" : "py-2.5"} text-sm font-medium text-white`,
      }}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={mobile ? "" : "hidden lg:inline"}>{module.label}</span>
    </Link>
  );
}
