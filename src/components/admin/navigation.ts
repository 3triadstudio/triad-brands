import {
  Briefcase,
  LayoutTemplate,
  Image,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Package,
  Settings,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type AdminNavModule = {
  label: string;
  to:
    | "/admin"
    | "/admin/builder"
    | "/admin/catalog"
    | "/admin/hero"
    | "/admin/work"
    | "/admin/services"
    | "/admin/socials"
    | "/admin/leads"
    | "/admin/settings"
    | "/admin/users";
  icon: LucideIcon;
  exact?: boolean;
};

export const adminNavGroups: { label: string; modules: AdminNavModule[] }[] = [
  {
    label: "Main menu",
    modules: [
      { label: "Overview", to: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Page builder", to: "/admin/builder", icon: LayoutTemplate },
      { label: "Catalog", to: "/admin/catalog", icon: Package },
      { label: "Hero carousel", to: "/admin/hero", icon: Image },
    ],
  },
  {
    label: "Content",
    modules: [
      { label: "Work", to: "/admin/work", icon: Briefcase },
      { label: "Services", to: "/admin/services", icon: Wrench },
      { label: "Social links", to: "/admin/socials", icon: Link2 },
    ],
  },
  {
    label: "Operations",
    modules: [{ label: "Leads", to: "/admin/leads", icon: MessageSquare }],
  },
  {
    label: "Settings",
    modules: [
      { label: "Site settings", to: "/admin/settings", icon: Settings },
      { label: "Users & roles", to: "/admin/users", icon: UsersRound },
    ],
  },
];

export const adminModules: AdminNavModule[] = adminNavGroups.flatMap((group) => group.modules);
