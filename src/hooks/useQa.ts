import { useQuery } from "@tanstack/react-query";
import { qaService } from "@/services/qa";
import { useBranchStore } from "@/store/branch.store";

export function useQaOverview() {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: ["qa", "overview", activeBranchId] as const,
    queryFn: () => qaService.getOverview(activeBranchId ?? undefined),
    select: (data) => data.data,
  });
}

export function useQaTurnaround() {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: ["qa", "turnaround", activeBranchId] as const,
    queryFn: () => qaService.getTurnaround(activeBranchId ?? undefined),
    select: (data) => data.data,
  });
}

export function useQaRejectionRates() {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: ["qa", "rejection-rates", activeBranchId] as const,
    queryFn: () => qaService.getRejectionRates(activeBranchId ?? undefined),
    select: (data) => data.data,
  });
}

export function useQaVolumes() {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: ["qa", "volumes", activeBranchId] as const,
    queryFn: () => qaService.getVolumes(activeBranchId ?? undefined),
    select: (data) => data.data,
  });
}
