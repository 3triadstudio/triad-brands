import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { assignUserRole, inviteUser, listUsers } from "@/lib/admin.functions";
import { APP_ROLES, roleLabels, type AppRole } from "@/lib/access";
import {
  AdminError,
  AdminLoading,
  AdminPage,
  Field,
  Modal,
  Panel,
  PanelHeading,
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: UsersAdmin });

type UserRow = { id: string; email: string; createdAt: string; role: AppRole | null };

function UsersAdmin() {
  const list = useServerFn(listUsers);
  const invite = useServerFn(inviteUser);
  const assign = useServerFn(assignUserRole);
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("editor");
  const [pendingRoles, setPendingRoles] = useState<Record<string, AppRole>>({});

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => list({}) });

  const inviteMutation = useMutation({
    mutationFn: () => invite({ data: { email, role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEmail("");
      setRole("editor");
      setInviteOpen(false);
      toast.success("Invitation sent");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not invite user"),
  });

  const roleMutation = useMutation({
    mutationFn: (input: { userId: string; role: AppRole }) => assign({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
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
      description="Invite teammates and manage who can sign in to the studio."
      action={
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937]"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Add user
        </button>
      }
    >
      {inviteOpen ? (
        <Modal
          title="Invite a user"
          subtitle="They'll receive a secure Supabase invitation email."
          onClose={() => setInviteOpen(false)}
        >
          <form
            className="space-y-4 p-5 md:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate();
            }}
          >
            <Field label="Email address">
              <input
                type="email"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
              />
            </Field>
            <Field label="Role">
              <select
                className={inputClass}
                value={role}
                onChange={(e) => setRole(e.target.value as AppRole)}
              >
                {APP_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2 border-t border-[#F3F4F6] pt-4">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="min-h-10 rounded-xl border border-[#E5E7EB] px-4 text-xs font-semibold text-[#111827] hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="min-h-10 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] disabled:opacity-60"
              >
                {inviteMutation.isPending ? "Sending…" : "Send invitation"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      <Panel>
        <PanelHeading
          icon={Users}
          title="Team members"
          detail={`${rows.length} registered account${rows.length === 1 ? "" : "s"}`}
        />
        <div className="space-y-3 p-4 md:p-6">
          {users.isPending ? (
            <AdminLoading label="Loading users" />
          ) : users.isError ? (
            <AdminError detail="Users could not be loaded." onRetry={() => void users.refetch()} />
          ) : (
            rows.map((user) => {
              const nextRole = pendingRoles[user.id] ?? user.role ?? "subscriber";
              return (
                <article
                  key={user.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#DCFCE7] text-[#166534]">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#111827]">
                        {user.email || "Pending email"}
                      </p>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className={inputClass}
                      value={nextRole}
                      onChange={(e) =>
                        setPendingRoles((c) => ({ ...c, [user.id]: e.target.value as AppRole }))
                      }
                    >
                      {APP_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabels[r]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={roleMutation.isPending || nextRole === user.role}
                      onClick={() => roleMutation.mutate({ userId: user.id, role: nextRole })}
                      className="min-h-10 rounded-xl border border-[#E5E7EB] px-3 text-xs font-semibold text-[#111827] transition-colors hover:border-[#ED1D2B] hover:text-[#ED1D2B] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Save role
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </Panel>
    </AdminPage>
  );
}
