"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profileService } from "@/services/profile";
import type {
  UpdateLabProfileRequest,
  CreateTestMenuItemRequest,
  UpdateTestMenuItemRequest,
  OperatingHours,
} from "@/types/profile";

export const PROFILE_KEY = ["profile"] as const;
export const TEST_MENU_KEY = ["test-menu"] as const;
export const OPERATING_HOURS_KEY = ["operating-hours"] as const;
export const VERIFICATION_DOCS_KEY = ["verification-docs"] as const;

// ── Profile ───────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => profileService.getProfile().then((r) => r.data.data!),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateLabProfileRequest) =>
      profileService.updateProfile(body).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      toast.success("Profile updated.");
    },
    onError: () => toast.error("Failed to update profile."),
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      profileService.uploadLogo(file).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      toast.success("Logo uploaded.");
    },
    onError: () => toast.error("Failed to upload logo."),
  });
}

// ── Test Menu ─────────────────────────────────────────────────────────────

export function useTestMenu() {
  return useQuery({
    queryKey: TEST_MENU_KEY,
    queryFn: () => profileService.getTestMenu().then((r) => r.data.data!),
  });
}

export function useCreateTestMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTestMenuItemRequest) =>
      profileService.createTestMenuItem(body).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_MENU_KEY });
      toast.success("Test item added.");
    },
    onError: () => toast.error("Failed to add test item."),
  });
}

export function useUpdateTestMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTestMenuItemRequest }) =>
      profileService.updateTestMenuItem(id, body).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_MENU_KEY });
      toast.success("Test item updated.");
    },
    onError: () => toast.error("Failed to update test item."),
  });
}

export function useDeleteTestMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileService.deleteTestMenuItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_MENU_KEY });
      toast.success("Test item removed.");
    },
    onError: () => toast.error("Failed to remove test item."),
  });
}

// ── Operating Hours ───────────────────────────────────────────────────────

export function useOperatingHours() {
  return useQuery({
    queryKey: OPERATING_HOURS_KEY,
    queryFn: () => profileService.getOperatingHours().then((r) => r.data.data!),
  });
}

export function useUpdateOperatingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OperatingHours) =>
      profileService.updateOperatingHours(body).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OPERATING_HOURS_KEY });
      toast.success("Operating hours saved.");
    },
    onError: () => toast.error("Failed to save operating hours."),
  });
}

// ── Verification Docs ─────────────────────────────────────────────────────

export function useVerificationDocs() {
  return useQuery({
    queryKey: VERIFICATION_DOCS_KEY,
    queryFn: () => profileService.getVerificationDocs().then((r) => r.data.data!),
  });
}

export function useUploadVerificationDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docType, file }: { docType: string; file: File }) =>
      profileService.uploadVerificationDoc(docType, file).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VERIFICATION_DOCS_KEY });
      toast.success("Document uploaded.");
    },
    onError: () => toast.error("Failed to upload document."),
  });
}

export function useDeleteVerificationDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => profileService.deleteVerificationDoc(docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VERIFICATION_DOCS_KEY });
      toast.success("Document removed.");
    },
    onError: () => toast.error("Failed to remove document."),
  });
}
