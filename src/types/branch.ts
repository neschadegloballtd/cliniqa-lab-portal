export interface LabBranch {
  id: string;
  labId: string;
  branchName: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressLga: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  isHeadquarters: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchRequest {
  branchName: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressLga?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

export interface UpdateBranchRequest {
  branchName?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressLga?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

export interface BranchStaffMember {
  staffId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  assignedAt: string;
}
