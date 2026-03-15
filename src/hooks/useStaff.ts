"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { staffService } from "@/services/staff";
import {
  useLabAuthStore,
  saveRefreshToken,
  saveSessionCookie,
} from "@/store/lab-auth.store";
import type { InviteStaffRequest, StaffLoginRequest, UpdateStaffRoleRequest } from "@/types/staff";

const STAFF_KEY = ["staff"];

export function useStaffList() {
  return useQuery({
    queryKey: STAFF_KEY,
    queryFn: () => staffService.listStaff().then((r) => r.data.data ?? []),
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteStaffRequest) => staffService.invite(body),
    onSuccess: ({ data }) => {
      toast.success(data.data?.message ?? "Invite sent!");
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to send invite."));
    },
  });
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, role }: { staffId: string; role: UpdateStaffRoleRequest["role"] }) =>
      staffService.updateRole(staffId, { role }),
    onSuccess: () => {
      toast.success("Role updated.");
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to update role."));
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => staffService.deactivate(staffId),
    onSuccess: () => {
      toast.success("Staff member deactivated.");
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to deactivate staff."));
    },
  });
}

export function useReactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => staffService.reactivate(staffId),
    onSuccess: () => {
      toast.success("Staff member reactivated.");
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to reactivate staff."));
    },
  });
}

export function useRemoveStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => staffService.remove(staffId),
    onSuccess: () => {
      toast.success("Staff member removed.");
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to remove staff member."));
    },
  });
}

export function useAcceptInvite() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      staffService.acceptInvite({ token, password }),
    onSuccess: () => {
      toast.success("Account set up! Please log in as staff.");
      router.push("/staff-login");
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to accept invite."));
    },
  });
}

export function useStaffLogin() {
  const router = useRouter();
  const setStaffAuth = useLabAuthStore((s) => s.setStaffAuth);

  return useMutation({
    mutationFn: (body: StaffLoginRequest) => staffService.login(body),
    onSuccess: ({ data }) => {
      const payload = data.data!;
      setStaffAuth({
        accessToken: payload.accessToken,
        labId: String(payload.labId),
        staffId: String(payload.staffId),
        firstName: payload.firstName,
        lastName: payload.lastName,
        staffRole: payload.staffRole,
        tier: payload.tier,
        inTrial: payload.inTrial,
        labName: payload.labName,
      });
      saveRefreshToken(payload.refreshToken);
      saveSessionCookie(String(payload.labId), payload.tier, "ACTIVE");
      toast.success(`Welcome, ${payload.firstName}!`);
      router.push("/dashboard");
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Login failed. Check your credentials."));
    },
  });
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response
  ) {
    const d = (err.response as { data?: { error?: { message?: string } } }).data;
    return d?.error?.message ?? fallback;
  }
  return fallback;
}
