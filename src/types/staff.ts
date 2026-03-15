import type { LabStaffRole } from "@/types/auth";

export interface LabStaffMember {
  id: string;
  labId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: LabStaffRole;
  isActive: boolean;
  inviteAcceptedAt: string | null;
  createdAt: string;
}

export interface InviteStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: LabStaffRole;
}

export interface InviteStaffResponse {
  staffId: string;
  email: string;
  message: string;
}

export interface UpdateStaffRoleRequest {
  role: LabStaffRole;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

export interface StaffLoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
}
