import api from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type { Booking, BookingStatus, CreateBookingRequest, MarkPaidRequest } from "@/types/bookings";

const BASE = "/lab/v1/bookings";

export const bookingsService = {
  list(params?: {
    branchId?: string;
    status?: BookingStatus | "ALL";
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PagedResponse<Booking>>> {
    const { status, branchId, ...rest } = params ?? {};
    return api
      .get(BASE, {
        params: {
          ...rest,
          ...(branchId ? { branchId } : {}),
          ...(status && status !== "ALL" ? { status } : {}),
        },
      })
      .then((r) => r.data);
  },

  get(id: string): Promise<ApiResponse<Booking>> {
    return api.get(`${BASE}/${id}`).then((r) => r.data);
  },

  create(data: CreateBookingRequest): Promise<ApiResponse<Booking>> {
    return api.post(BASE, data).then((r) => r.data);
  },

  confirm(id: string): Promise<ApiResponse<Booking>> {
    return api.patch(`${BASE}/${id}/confirm`).then((r) => r.data);
  },

  markSampleCollected(id: string): Promise<ApiResponse<Booking>> {
    return api.patch(`${BASE}/${id}/sample-collected`).then((r) => r.data);
  },

  complete(id: string): Promise<ApiResponse<Booking>> {
    return api.patch(`${BASE}/${id}/complete`).then((r) => r.data);
  },

  cancel(id: string): Promise<ApiResponse<Booking>> {
    return api.patch(`${BASE}/${id}/cancel`).then((r) => r.data);
  },

  noShow(id: string): Promise<ApiResponse<Booking>> {
    return api.patch(`${BASE}/${id}/no-show`).then((r) => r.data);
  },

  markPaid(id: string, data: MarkPaidRequest): Promise<ApiResponse<Booking>> {
    return api.patch(`${BASE}/${id}/mark-paid`, data).then((r) => r.data);
  },

  markWaived(id: string): Promise<ApiResponse<Booking>> {
    return api.patch(`${BASE}/${id}/mark-waived`).then((r) => r.data);
  },

  searchByContact(phone?: string, email?: string): Promise<ApiResponse<Booking[]>> {
    return api.get(`${BASE}/search`, { params: { phone, email } }).then((r) => r.data);
  },
};
