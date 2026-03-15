import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { preAnalyticalService } from "@/services/pre-analytical";
import type {
  LogPreAnalyticalErrorRequest,
  PreAnalyticalFilter,
  ResolvePreAnalyticalErrorRequest,
} from "@/types/pre-analytical";
import { useBranchStore } from "@/store/branch.store";

const KEYS = {
  all: ["pre-analytical"] as const,
  list: (branchId?: string | null, filter?: string, page?: number) =>
    ["pre-analytical", "list", branchId, filter, page] as const,
  detail: (id: string) => ["pre-analytical", id] as const,
};

export function usePreAnalyticalErrors(params?: {
  filter?: PreAnalyticalFilter;
  page?: number;
  size?: number;
}) {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: KEYS.list(activeBranchId, params?.filter, params?.page),
    queryFn: () => preAnalyticalService.list({ ...params, branchId: activeBranchId ?? undefined }),
    select: (data) => data.data,
  });
}

export function usePreAnalyticalError(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => preAnalyticalService.get(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useLogPreAnalyticalError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LogPreAnalyticalErrorRequest) => preAnalyticalService.log(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useResolvePreAnalyticalError(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ResolvePreAnalyticalErrorRequest) =>
      preAnalyticalService.resolve(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useNotifyPatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => preAnalyticalService.notifyPatient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
  });
}
