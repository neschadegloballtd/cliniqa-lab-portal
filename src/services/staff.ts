import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { StaffAuthResponse } from "@/types/auth";
import type {
  AcceptInviteRequest,
  InviteStaffRequest,
  InviteStaffResponse,
  LabStaffMember,
  StaffLoginRequest,
  UpdateStaffRoleRequest,
} from "@/types/staff";

export const staffService = {
  invite: (body: InviteStaffRequest) =>
    api.post<ApiResponse<InviteStaffResponse>>("/lab/v1/staff/invite", body),

  acceptInvite: (body: AcceptInviteRequest) =>
    api.post<ApiResponse<void>>("/lab/v1/staff/accept-invite", body),

  login: (body: StaffLoginRequest) =>
    api.post<ApiResponse<StaffAuthResponse>>("/lab/v1/staff/login", body),

  logout: (body: { refreshToken: string }) =>
    api.post<ApiResponse<void>>("/lab/v1/staff/logout", body),

  listStaff: () =>
    api.get<ApiResponse<LabStaffMember[]>>("/lab/v1/staff"),

  updateRole: (staffId: string, body: UpdateStaffRoleRequest) =>
    api.patch<ApiResponse<void>>(`/lab/v1/staff/${staffId}/role`, body),

  deactivate: (staffId: string) =>
    api.patch<ApiResponse<void>>(`/lab/v1/staff/${staffId}/deactivate`),

  reactivate: (staffId: string) =>
    api.patch<ApiResponse<void>>(`/lab/v1/staff/${staffId}/reactivate`),

  remove: (staffId: string) =>
    api.delete<ApiResponse<void>>(`/lab/v1/staff/${staffId}`),
};
