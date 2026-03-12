import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  LabProfile,
  UpdateLabProfileRequest,
  TestMenuItem,
  CreateTestMenuItemRequest,
  UpdateTestMenuItemRequest,
  OperatingHours,
  VerificationDoc,
} from "@/types/profile";

export const profileService = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile: () =>
    api.get<ApiResponse<LabProfile>>("/lab/v1/profile"),

  updateProfile: (body: UpdateLabProfileRequest) =>
    api.put<ApiResponse<LabProfile>>("/lab/v1/profile", body),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiResponse<{ logoUrl: string }>>("/lab/v1/profile/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ── Test Menu ─────────────────────────────────────────────────────────────
  getTestMenu: () =>
    api.get<ApiResponse<TestMenuItem[]>>("/lab/v1/profile/test-menu"),

  createTestMenuItem: (body: CreateTestMenuItemRequest) =>
    api.post<ApiResponse<TestMenuItem>>("/lab/v1/profile/test-menu", body),

  updateTestMenuItem: (id: string, body: UpdateTestMenuItemRequest) =>
    api.patch<ApiResponse<TestMenuItem>>(`/lab/v1/profile/test-menu/${id}`, body),

  deleteTestMenuItem: (id: string) =>
    api.delete<ApiResponse<void>>(`/lab/v1/profile/test-menu/${id}`),

  // ── Operating Hours ───────────────────────────────────────────────────────
  getOperatingHours: () =>
    api.get<ApiResponse<OperatingHours>>("/lab/v1/profile/operating-hours"),

  updateOperatingHours: (body: OperatingHours) =>
    api.put<ApiResponse<OperatingHours>>("/lab/v1/profile/operating-hours", body),

  // ── Verification Docs ─────────────────────────────────────────────────────
  getVerificationDocs: () =>
    api.get<ApiResponse<VerificationDoc[]>>("/lab/v1/verification/documents"),

  uploadVerificationDoc: (docType: string, file: File) => {
    const form = new FormData();
    form.append("docType", docType);
    form.append("file", file);
    return api.post<ApiResponse<VerificationDoc>>("/lab/v1/verification/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteVerificationDoc: (docId: string) =>
    api.delete<ApiResponse<void>>(`/lab/v1/verification/documents/${docId}`),
};
