import { useQuery } from "@tanstack/react-query";
import { qaService } from "@/services/qa";

const KEYS = {
  overview: ["qa", "overview"] as const,
  turnaround: ["qa", "turnaround"] as const,
  rejectionRates: ["qa", "rejection-rates"] as const,
  volumes: ["qa", "volumes"] as const,
};

export function useQaOverview() {
  return useQuery({
    queryKey: KEYS.overview,
    queryFn: () => qaService.getOverview(),
    select: (data) => data.data,
  });
}

export function useQaTurnaround() {
  return useQuery({
    queryKey: KEYS.turnaround,
    queryFn: () => qaService.getTurnaround(),
    select: (data) => data.data,
  });
}

export function useQaRejectionRates() {
  return useQuery({
    queryKey: KEYS.rejectionRates,
    queryFn: () => qaService.getRejectionRates(),
    select: (data) => data.data,
  });
}

export function useQaVolumes() {
  return useQuery({
    queryKey: KEYS.volumes,
    queryFn: () => qaService.getVolumes(),
    select: (data) => data.data,
  });
}
