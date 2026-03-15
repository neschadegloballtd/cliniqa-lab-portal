"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, MoreVertical, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useLabAuthStore } from "@/store/lab-auth.store";
import {
  useStaffList,
  useInviteStaff,
  useUpdateStaffRole,
  useDeactivateStaff,
  useReactivateStaff,
  useRemoveStaff,
} from "@/hooks/useStaff";
import type { LabStaffMember } from "@/types/staff";
import type { LabStaffRole } from "@/types/auth";

const ASSIGNABLE_ROLES: LabStaffRole[] = ["ADMIN", "MANAGER", "TECHNICIAN", "RECEPTIONIST"];

const ROLE_STYLES: Record<LabStaffRole, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  MANAGER: "bg-indigo-100 text-indigo-800",
  TECHNICIAN: "bg-green-100 text-green-800",
  RECEPTIONIST: "bg-amber-100 text-amber-800",
};

const inviteSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN", "RECEPTIONIST"]),
});

type InviteForm = z.infer<typeof inviteSchema>;

function RoleBadge({ role }: { role: LabStaffRole }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  );
}

function StaffRow({ member, canManage }: { member: LabStaffMember; canManage: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [newRole, setNewRole] = useState<LabStaffRole>(member.role);
  const [showRoleEdit, setShowRoleEdit] = useState(false);

  const updateRole = useUpdateStaffRole();
  const deactivate = useDeactivateStaff();
  const reactivate = useReactivateStaff();
  const remove = useRemoveStaff();

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 px-4">
        <div className="font-medium text-sm">{member.firstName} {member.lastName}</div>
        <div className="text-xs text-muted-foreground">{member.email}</div>
      </td>
      <td className="py-3 px-4">
        <RoleBadge role={member.role} />
      </td>
      <td className="py-3 px-4 text-sm">
        {member.isActive ? (
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle className="h-3.5 w-3.5" /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-400">
            <XCircle className="h-3.5 w-3.5" /> Inactive
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {member.inviteAcceptedAt
          ? format(new Date(member.inviteAcceptedAt), "dd MMM yyyy")
          : "Invite pending"}
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {format(new Date(member.createdAt), "dd MMM yyyy")}
      </td>
      {canManage && member.role !== "OWNER" && (
        <td className="py-3 px-4 relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1 rounded hover:bg-accent"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-4 top-10 z-10 min-w-[160px] rounded-lg border border-border bg-white shadow-lg py-1">
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
                onClick={() => { setShowRoleEdit(true); setMenuOpen(false); }}
              >
                Change Role
              </button>
              {member.isActive ? (
                <button
                  className="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-accent"
                  onClick={() => { deactivate.mutate(member.id); setMenuOpen(false); }}
                >
                  Deactivate
                </button>
              ) : (
                <button
                  className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-accent"
                  onClick={() => { reactivate.mutate(member.id); setMenuOpen(false); }}
                >
                  Reactivate
                </button>
              )}
              <button
                className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent flex items-center gap-2"
                onClick={() => { remove.mutate(member.id); setMenuOpen(false); }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          )}
          {showRoleEdit && (
            <div className="absolute right-4 top-10 z-10 min-w-[180px] rounded-lg border border-border bg-white shadow-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">New Role</p>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as LabStaffRole)}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateRole.mutate({ staffId: member.id, role: newRole });
                    setShowRoleEdit(false);
                  }}
                  className="flex-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowRoleEdit(false)}
                  className="flex-1 rounded border border-input px-2 py-1 text-xs hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </td>
      )}
      {(!canManage || member.role === "OWNER") && <td className="py-3 px-4" />}
    </tr>
  );
}

export default function StaffPage() {
  const staffRole = useLabAuthStore((s) => s.staffRole);
  const isOwner = staffRole === null || staffRole === "OWNER";
  const canManage = isOwner || staffRole === "ADMIN";

  const [showInvite, setShowInvite] = useState(false);
  const { data: staffList = [], isLoading } = useStaffList();
  const invite = useInviteStaff();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) });

  function onInvite(data: InviteForm) {
    invite.mutate(data, {
      onSuccess: () => {
        reset();
        setShowInvite(false);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage staff members and their access levels.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Invite Staff
          </button>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold">Invite Staff Member</h2>
            <form onSubmit={handleSubmit(onInvite)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">First Name</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    {...register("firstName")}
                  />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Last Name</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    {...register("lastName")}
                  />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Role</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("role")}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={invite.isPending}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {invite.isPending ? "Sending…" : "Send Invite"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowInvite(false); reset(); }}
                  className="flex-1 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading staff…</div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No staff members yet.{" "}
            {canManage && (
              <button onClick={() => setShowInvite(true)} className="text-primary hover:underline">
                Invite your first staff member
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4">Invited</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => (
                <StaffRow key={member.id} member={member} canManage={canManage} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
