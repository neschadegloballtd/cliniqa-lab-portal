"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BranchState {
  activeBranchId: string | null;
  activeBranchName: string | null;
  setActiveBranch: (id: string, name: string) => void;
  clearActiveBranch: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      activeBranchId: null,
      activeBranchName: null,

      setActiveBranch: (id, name) => set({ activeBranchId: id, activeBranchName: name }),
      clearActiveBranch: () => set({ activeBranchId: null, activeBranchName: null }),
    }),
    {
      name: "cliniqa_active_branch",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : ({} as Storage)
      ),
      partialize: (state) => ({
        activeBranchId: state.activeBranchId,
        activeBranchName: state.activeBranchName,
      }),
    }
  )
);
