"use client";

import { useLabAuthStore } from "@/store/lab-auth.store";
import { useBranchStore } from "@/store/branch.store";
import { useLogout } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useBranch";
import { LogOut, Building2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const labName = useLabAuthStore((s) => s.labName);
  const logout = useLogout();
  const { activeBranchId, activeBranchName, setActiveBranch } = useBranchStore();
  const { data: branches } = useBranches();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-select HQ branch on first load if nothing is selected
  useEffect(() => {
    if (!activeBranchId && branches && branches.length > 0) {
      const hq = branches.find((b) => b.isHeadquarters) ?? branches[0];
      setActiveBranch(hq.id, hq.branchName);
    }
  }, [branches, activeBranchId, setActiveBranch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeBranches = branches?.filter((b) => b.isActive) ?? [];
  const showSelector = activeBranches.length > 1;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">{labName}</span>

        {showSelector && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-sm hover:bg-accent transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="max-w-[160px] truncate">{activeBranchName ?? "Select branch"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {open && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-md border border-border bg-background shadow-md">
                {activeBranches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setActiveBranch(branch.id, branch.branchName);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      activeBranchId === branch.id ? "font-semibold text-primary" : ""
                    }`}
                  >
                    {branch.branchName}
                    {branch.isHeadquarters && (
                      <span className="ml-1 text-[10px] text-amber-600">(HQ)</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!showSelector && activeBranchName && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {activeBranchName}
          </span>
        )}
      </div>

      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </header>
  );
}
