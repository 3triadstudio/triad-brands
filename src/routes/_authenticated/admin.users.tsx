import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminModal, Field, inputClass } from "@/components/admin/AdminField";
import { AdminError, AdminLoading, AdminPage, Panel, PanelHeading } from "@/components/admin/ui";
import {
  APP_ROLES,
  CAPABILITIES,
  capabilityLabels,
  defaultCapabilities,
  roleLabels,
  type AppRole,
  type Capability,
} from "@/lib/authorization";
import { assignUserRole, inviteUser, listUsers } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersAdmin,
});

type UserRow = {
  id: string;
  email: string;
  createdAt: string;
  role: AppRole | null;
  permissions: string[];
};

function UsersAdmin() {
  const list = useServerFn(listUsers);
  const invite = useServerFn(inviteUser);
  const assign = useServerFn(assignUserRole);
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("editor");
  const [permissions, setPermissions] = useState<Capability[]>(defaultCapabilities("editor"));
  const [roles, setRoles] = useState<Record<string, AppRole>>({});
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => list({}) });

  const inviteMutation = useMutation({
    mutationFn: () => invite({ data: { email, role, permissions } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEmail("");
      setRole("editor");
      setPermissions(defaultCapabilities("editor"));
      setInviteOpen(false);
      toast.success("Invitation sent");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not invite user"),
  });

  const roleMutation = useMutation({
    mutationFn: (data: { userId: string; role: AppRole; permissions: string[] }) =>
      assign({ data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update role"),
  });

  const rows = (users.data ?? []) as UserRow[];

  return (
    <AdminPage
      eyebrow="Access control"
      title="Users & roles"
      description="Invite team members and manage their role-based dashboard access."
      action={
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-4 py-3 text-xs font-semibold text-[#0F1217]"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add user
        </button>
      }
    >
      {inviteOpen ? (
        <AdminModal
          title="Invite a user"
          subtitle="They will receive a secure Supabase invitation email."
          onClose={() => setInviteOpen(false)}
        >
          <form
            className="space-y-5 p-5 md:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              inviteMutation.mutate();
            }}
          >
            <Field label="Email address">
              <input
                className={inputClass}
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
              />
            </Field>
            <Field label="Role">
              <select
                className={inputClass}
                value={role}
                onChange={(event) => setRole(event.target.value as AppRole)}
              >
                {APP_ROLES.map((item) => (
                  <option key={item} value={item}>
                    {roleLabels[item]}
                  </option>
                ))}
              </select>
            </Field>
            <CapabilityCheckboxes permissions={permissions} onChange={setPermissions} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="label-mono rounded-full border border-white/10 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="label-mono rounded-full bg-[#FF7A00] px-4 py-2 text-[#0F1217] disabled:opacity-60"
              >
                {inviteMutation.isPending ? "Sending…" : "Send invitation"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <Panel>
        <PanelHeading
          icon={Users}
          title="Team members"
          detail={`${rows.length} registered account${rows.length === 1 ? "" : "s"}`}
        />
        <div className="space-y-3 p-4 md:p-6">
          {users.isPending ? <AdminLoading label="Loading users" /> : null}
          {users.isError ? (
            <AdminError detail="Users could not be loaded." onRetry={() => void users.refetch()} />
          ) : null}
          {rows.map((user) => {
            const nextRole = roles[user.id] ?? user.role ?? "subscriber";
            const nextPermissions = (userPermissions[user.id] ?? user.permissions) as Capability[];
            return (
              <article
                key={user.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#101820] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#3FD07E]/15 text-[#B9F5D1]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {user.email || "Pending email"}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-xl border border-white/[0.08] bg-[#1C222B] px-3 py-2 text-xs text-white"
                    value={nextRole}
                    onChange={(event) =>
                      setRoles((current) => ({
                        ...current,
                        [user.id]: event.target.value as AppRole,
                      }))
                    }
                  >
                    {APP_ROLES.map((item) => (
                      <option key={item} value={item}>
                        {roleLabels[item]}
                      </option>
                    ))}
                  </select>
                  <div className="grid w-full grid-cols-1 gap-2 rounded-xl border border-white/[0.08] bg-[#0B1116] p-3 sm:grid-cols-2">
                    {CAPABILITIES.map((capability) => (
                      <label
                        key={capability}
                        className="flex items-center gap-2 text-xs text-[#CBD5E1]"
                      >
                        <input
                          type="checkbox"
                          checked={nextPermissions.includes(capability)}
                          onChange={(event) =>
                            setUserPermissions((current) => ({
                              ...current,
                              [user.id]: event.target.checked
                                ? [...nextPermissions, capability]
                                : nextPermissions.filter((item) => item !== capability),
                            }))
                          }
                          className="h-4 w-4 accent-[#3FD07E]"
                        />
                        {capabilityLabels[capability]}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={
                      roleMutation.isPending ||
                      (nextRole === user.role &&
                        JSON.stringify(nextPermissions) === JSON.stringify(user.permissions))
                    }
                    onClick={() =>
                      roleMutation.mutate({
                        userId: user.id,
                        role: nextRole,
                        permissions: nextPermissions,
                      })
                    }
                    className="rounded-xl border border-[#3FD07E]/25 px-3 py-2 text-xs text-[#B9F5D1] disabled:opacity-40"
                  >
                    Save role
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </AdminPage>
  );
}

function CapabilityCheckboxes({
  permissions,
  onChange,
}: {
  permissions: Capability[];
  onChange: (permissions: Capability[]) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="label-mono text-muted-foreground">What can this user do?</p>
      <div className="grid gap-2 rounded-xl border border-white/[0.08] bg-[#0B1116] p-3 sm:grid-cols-2">
        {CAPABILITIES.map((capability) => (
          <label key={capability} className="flex items-center gap-2 text-xs text-[#CBD5E1]">
            <input
              type="checkbox"
              checked={permissions.includes(capability)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...permissions, capability]
                    : permissions.filter((item) => item !== capability),
                )
              }
              className="h-4 w-4 accent-[#3FD07E]"
            />
            {capabilityLabels[capability]}
          </label>
        ))}
      </div>
    </div>
  );
}
