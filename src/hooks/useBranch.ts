import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { branchService } from "@/services/branch";
import type { CreateBranchRequest, UpdateBranchRequest } from "@/types/branch";
import type { OperatingHoursEntry } from "@/types/profile";

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.listBranches().then((r) => r.data.data ?? []),
  });
}

export function useBranch(branchId: string) {
  return useQuery({
    queryKey: ["branches", branchId],
    queryFn: () => branchService.getBranch(branchId).then((r) => r.data.data!),
    enabled: !!branchId,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBranchRequest) =>
      branchService.createBranch(body).then((r) => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useUpdateBranch(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateBranchRequest) =>
      branchService.updateBranch(branchId, body).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["branches", branchId] });
    },
  });
}

export function useDeactivateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) => branchService.deactivateBranch(branchId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useBranchHours(branchId: string) {
  return useQuery({
    queryKey: ["branches", branchId, "hours"],
    queryFn: () => branchService.getBranchHours(branchId).then((r) => r.data.data ?? []),
    enabled: !!branchId,
  });
}

export function useSetBranchHours(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hours: OperatingHoursEntry[]) =>
      branchService.setBranchHours(branchId, hours).then((r) => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches", branchId, "hours"] }),
  });
}

export function useBranchStaff(branchId: string) {
  return useQuery({
    queryKey: ["branches", branchId, "staff"],
    queryFn: () => branchService.listBranchStaff(branchId).then((r) => r.data.data ?? []),
    enabled: !!branchId,
  });
}

export function useAssignStaff(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => branchService.assignStaff(branchId, staffId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches", branchId, "staff"] }),
  });
}

export function useRemoveStaff(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => branchService.removeStaff(branchId, staffId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches", branchId, "staff"] }),
  });
}
