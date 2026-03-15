"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Plus, Star, Trash2 } from "lucide-react";
import { useBranches, useDeactivateBranch } from "@/hooks/useBranch";
import { useBranchStore } from "@/store/branch.store";
import { useLabAuthStore } from "@/store/lab-auth.store";

export default function BranchesPage() {
  const { data: branches, isLoading } = useBranches();
  const deactivate = useDeactivateBranch();
  const { activeBranchId, setActiveBranch } = useBranchStore();
  const staffRole = useLabAuthStore((s) => s.staffRole);
  const isOwnerOrAdmin = staffRole === null || staffRole === "OWNER" || staffRole === "ADMIN";

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const activeBranches = branches?.filter((b) => b.isActive) ?? [];

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Branches</h1>
        {isOwnerOrAdmin && (
          <Link
            href="/profile/branches/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Branch
          </Link>
        )}
      </div>

      {activeBranches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No branches found.</p>
      ) : (
        <ul className="space-y-3">
          {activeBranches.map((branch) => {
            const isActive = activeBranchId === branch.id;
            return (
              <li
                key={branch.id}
                className={`flex items-start justify-between rounded-lg border px-4 py-3 transition-colors ${
                  isActive ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{branch.branchName}</span>
                      {branch.isHeadquarters && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          <Star className="h-3 w-3" /> HQ
                        </span>
                      )}
                    </div>
                    {(branch.addressStreet || branch.addressCity) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[branch.addressStreet, branch.addressCity, branch.addressState]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {branch.phone && (
                      <p className="text-xs text-muted-foreground">{branch.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => setActiveBranch(branch.id, branch.branchName)}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-accent"
                    }`}
                  >
                    {isActive ? "Active" : "Select"}
                  </button>

                  {isOwnerOrAdmin && (
                    <Link
                      href={`/profile/branches/${branch.id}`}
                      className="rounded px-3 py-1.5 text-xs font-medium border border-border hover:bg-accent transition-colors"
                    >
                      Edit
                    </Link>
                  )}

                  {isOwnerOrAdmin && !branch.isHeadquarters && (
                    <button
                      onClick={() => {
                        if (confirm(`Deactivate "${branch.branchName}"?`)) {
                          deactivate.mutate(branch.id);
                        }
                      }}
                      disabled={deactivate.isPending}
                      className="rounded p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                      title="Deactivate branch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        The selected branch determines the active context for bookings, results, and pre-analytical errors.
      </p>
    </div>
  );
}
