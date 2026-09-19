export const APP_ROLES = ["admin", "editor", "author", "contributor", "subscriber"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const roleRank: Record<AppRole, number> = {
  subscriber: 0,
  contributor: 1,
  author: 2,
  editor: 3,
  admin: 4,
};

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrator",
  editor: "Editor",
  author: "Author",
  contributor: "Contributor",
  subscriber: "Subscriber",
};

export const CAPABILITIES = [
  "dashboard",
  "content",
  "catalog",
  "leads",
  "projects",
  "settings",
  "users",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const capabilityLabels: Record<Capability, string> = {
  dashboard: "View dashboard",
  content: "Edit pages and sections",
  catalog: "Manage catalog",
  leads: "Manage leads",
  projects: "Manage work/projects",
  settings: "Manage site settings",
  users: "Manage users and roles",
};

const roleCapabilities: Record<AppRole, Capability[]> = {
  admin: [...CAPABILITIES],
  editor: ["dashboard", "content", "catalog", "leads", "projects", "settings"],
  author: ["dashboard", "projects"],
  contributor: ["dashboard"],
  subscriber: [],
};

export function defaultCapabilities(role: AppRole | null | undefined) {
  return role ? roleCapabilities[role] : [];
}

export function hasCapability(
  role: AppRole | null | undefined,
  permissions: string[] | null | undefined,
  capability: Capability,
) {
  if (role === "admin") return true;
  return (permissions?.length ? permissions : defaultCapabilities(role)).includes(capability);
}

export function normalizeRole(role: string | null | undefined): AppRole | null {
  if (
    role === "admin" ||
    role === "editor" ||
    role === "author" ||
    role === "contributor" ||
    role === "subscriber"
  ) {
    return role;
  }
  return null;
}

export function highestRole(roles: Array<string | null | undefined>) {
  return (
    roles
      .map(normalizeRole)
      .filter((role): role is AppRole => role !== null)
      .sort((a, b) => roleRank[b] - roleRank[a])[0] ?? null
  );
}

export function hasMinimumRole(role: AppRole | null | undefined, minimum: AppRole) {
  return role ? roleRank[role] >= roleRank[minimum] : false;
}

export function canAccessDashboard(role: AppRole | null | undefined) {
  return hasMinimumRole(role, "editor");
}

export function canManageContent(role: AppRole | null | undefined) {
  return hasMinimumRole(role, "editor");
}
