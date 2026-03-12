import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsService } from "@/services/bookings";
import type { BookingStatus, CreateBookingRequest } from "@/types/bookings";

const KEYS = {
  all: ["bookings"] as const,
  list: (status?: string, dateFrom?: string, dateTo?: string, page?: number) =>
    ["bookings", "list", status, dateFrom, dateTo, page] as const,
  detail: (id: string) => ["bookings", id] as const,
};

export function useBookings(params?: {
  status?: BookingStatus | "ALL";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: KEYS.list(params?.status, params?.dateFrom, params?.dateTo, params?.page),
    queryFn: () => bookingsService.list(params),
    select: (data) => data.data,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => bookingsService.get(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingRequest) => bookingsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

function useBookingAction(action: (id: string) => Promise<unknown>, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => action(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useConfirmBooking(id: string) {
  return useBookingAction(bookingsService.confirm, id);
}

export function useMarkSampleCollected(id: string) {
  return useBookingAction(bookingsService.markSampleCollected, id);
}

export function useCompleteBooking(id: string) {
  return useBookingAction(bookingsService.complete, id);
}

export function useCancelBooking(id: string) {
  return useBookingAction(bookingsService.cancel, id);
}

export function useNoShowBooking(id: string) {
  return useBookingAction(bookingsService.noShow, id);
}
