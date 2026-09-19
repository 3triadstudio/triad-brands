import {
  Blocks,
  Briefcase,
  LayoutDashboard,
  Link2,
  MessageCircle,
  Package,
  Palette,
  Wrench,
} from "lucide-react";

export const adminModules = [
  { label: "Overview", to: "/admin" as const, icon: LayoutDashboard, exact: true },
  { label: "Builder", to: "/admin/builder" as const, icon: Blocks },
  { label: "Site Settings", to: "/admin/theme" as const, icon: Palette },
  { label: "Catalog", to: "/admin/catalog" as const, icon: Package },
  { label: "WhatsApp Leads", to: "/admin/whatsapp" as const, icon: MessageCircle },
  { label: "Work", to: "/admin/projects" as const, icon: Briefcase },
  { label: "Services", to: "/admin/services" as const, icon: Wrench },
  { label: "Socials", to: "/admin/socials" as const, icon: Link2 },
  { label: "Sections", to: "/admin/sections" as const, icon: Blocks },
  { label: "Users & roles", to: "/admin/users" as const, icon: Briefcase },
];
