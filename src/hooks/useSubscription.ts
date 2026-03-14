import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription";
import type { InitializeSubscriptionRequest } from "@/types/subscription";

const KEYS = {
  status: ["subscription", "status"] as const,
};

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: KEYS.status,
    queryFn: () => subscriptionService.getStatus(),
    select: (data) => data.data,
  });
}

export function useInitializeSubscription() {
  return useMutation({
    mutationFn: (data: InitializeSubscriptionRequest) =>
      subscriptionService.initialize(data),
  });
}

export function useVerifySubscription(reference: string | null) {
  return useQuery({
    queryKey: ["subscription", "verify", reference],
    queryFn: () => subscriptionService.verify(reference!),
    select: (data) => data.data,
    enabled: !!reference,
    retry: false,
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionService.cancel(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.status }),
  });
}
