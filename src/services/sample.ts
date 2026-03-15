import api from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type {
  LabSample,
  RegisterSampleRequest,
  SampleStatus,
  TransitionStatusRequest,
  LinkToBookingRequest,
} from "@/types/sample";

const BASE = "/lab/v1/samples";

export const sampleService = {
  list(params?: {
    branchId?: string;
    status?: SampleStatus;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PagedResponse<LabSample>>> {
    return api.get(BASE, { params }).then((r) => r.data);
  },

  get(id: string): Promise<ApiResponse<LabSample>> {
    return api.get(`${BASE}/${id}`).then((r) => r.data);
  },

  getByBarcode(barcode: string): Promise<ApiResponse<LabSample>> {
    return api.get(`${BASE}/barcode/${encodeURIComponent(barcode)}`).then((r) => r.data);
  },

  getByBooking(bookingId: string): Promise<ApiResponse<LabSample[]>> {
    return api.get(`${BASE}/by-booking/${bookingId}`).then((r) => r.data);
  },

  register(data: RegisterSampleRequest): Promise<ApiResponse<LabSample>> {
    return api.post(BASE, data).then((r) => r.data);
  },

  transitionStatus(id: string, data: TransitionStatusRequest): Promise<ApiResponse<LabSample>> {
    return api.patch(`${BASE}/${id}/status`, data).then((r) => r.data);
  },

  linkToBooking(id: string, data: LinkToBookingRequest): Promise<ApiResponse<LabSample>> {
    return api.patch(`${BASE}/${id}/link-booking`, data).then((r) => r.data);
  },
};
