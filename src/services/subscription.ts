import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  LabSubscriptionStatus,
  InitializeSubscriptionRequest,
  InitializeSubscriptionResponse,
  VerifySubscriptionResponse,
} from "@/types/subscription";

export const subscriptionService = {
  getStatus(): Promise<ApiResponse<LabSubscriptionStatus>> {
    return api.get("/lab/v1/subscription/status").then((r) => r.data);
  },

  initialize(
    data: InitializeSubscriptionRequest,
  ): Promise<ApiResponse<InitializeSubscriptionResponse>> {
    return api.post("/lab/v1/subscription/initialize", data).then((r) => r.data);
  },

  verify(reference: string): Promise<ApiResponse<VerifySubscriptionResponse>> {
    return api
      .get("/lab/v1/subscription/verify", { params: { reference } })
      .then((r) => r.data);
  },

  cancel(): Promise<ApiResponse<void>> {
    return api.post("/lab/v1/subscription/cancel").then((r) => r.data);
  },
};
