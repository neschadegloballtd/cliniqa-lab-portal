import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sampleService } from "@/services/sample";
import type {
  RegisterSampleRequest,
  SampleStatus,
  TransitionStatusRequest,
  LinkToBookingRequest,
} from "@/types/sample";
import { useBranchStore } from "@/store/branch.store";

const KEYS = {
  all: ["samples"] as const,
  list: (branchId?: string | null, status?: string, page?: number) =>
    ["samples", "list", branchId, status, page] as const,
  detail: (id: string) => ["samples", id] as const,
  byBooking: (bookingId: string) => ["samples", "booking", bookingId] as const,
};

export function useSamples(params?: {
  status?: SampleStatus;
  page?: number;
  size?: number;
}) {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: KEYS.list(activeBranchId, params?.status, params?.page),
    queryFn: () =>
      sampleService.list({ ...params, branchId: activeBranchId ?? undefined }),
    select: (data) => data.data,
  });
}

export function useSample(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => sampleService.get(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useSamplesByBooking(bookingId: string) {
  return useQuery({
    queryKey: KEYS.byBooking(bookingId),
    queryFn: () => sampleService.getByBooking(bookingId),
    select: (data) => data.data,
    enabled: !!bookingId,
  });
}

export function useRegisterSample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterSampleRequest) => sampleService.register(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useTransitionSampleStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TransitionStatusRequest) =>
      sampleService.transitionStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useLinkSampleToBooking(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LinkToBookingRequest) =>
      sampleService.linkToBooking(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
