import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { LabBranch, CreateBranchRequest, UpdateBranchRequest, BranchStaffMember } from "@/types/branch";
import type { OperatingHoursEntry } from "@/types/profile";

export const branchService = {
  // ── Branches ─────────────────────────────────────────────────────────────
  listBranches: () =>
    api.get<ApiResponse<LabBranch[]>>("/lab/v1/branches"),

  getBranch: (branchId: string) =>
    api.get<ApiResponse<LabBranch>>(`/lab/v1/branches/${branchId}`),

  createBranch: (body: CreateBranchRequest) =>
    api.post<ApiResponse<LabBranch>>("/lab/v1/branches", body),

  updateBranch: (branchId: string, body: UpdateBranchRequest) =>
    api.put<ApiResponse<LabBranch>>(`/lab/v1/branches/${branchId}`, body),

  deactivateBranch: (branchId: string) =>
    api.delete<ApiResponse<void>>(`/lab/v1/branches/${branchId}`),

  // ── Operating Hours ───────────────────────────────────────────────────────
  getBranchHours: (branchId: string) =>
    api.get<ApiResponse<OperatingHoursEntry[]>>(`/lab/v1/branches/${branchId}/operating-hours`),

  setBranchHours: (branchId: string, hours: OperatingHoursEntry[]) =>
    api.put<ApiResponse<OperatingHoursEntry[]>>(`/lab/v1/branches/${branchId}/operating-hours`, { hours }),

  // ── Staff Assignments ─────────────────────────────────────────────────────
  listBranchStaff: (branchId: string) =>
    api.get<ApiResponse<BranchStaffMember[]>>(`/lab/v1/branches/${branchId}/staff`),

  assignStaff: (branchId: string, staffId: string) =>
    api.post<ApiResponse<void>>(`/lab/v1/branches/${branchId}/staff/${staffId}`, {}),

  removeStaff: (branchId: string, staffId: string) =>
    api.delete<ApiResponse<void>>(`/lab/v1/branches/${branchId}/staff/${staffId}`),
};
