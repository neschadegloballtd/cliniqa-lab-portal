"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";

const schema = z.object({
  labName: z.string().min(2, "Lab name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  accreditationNumber: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")).nullable(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading profile…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="flex gap-2">
          <Link
            href="/profile/logo"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Logo
          </Link>
          <Link
            href="/profile/test-menu"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Test Menu
          </Link>
          <Link
            href="/profile/operating-hours"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Hours
          </Link>
          <Link
            href="/profile/documents"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Documents
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
        {(
          [
            { name: "labName", label: "Lab Name" },
            { name: "phone", label: "Phone Number" },
            { name: "address", label: "Address" },
            { name: "city", label: "City" },
            { name: "state", label: "State" },
            { name: "accreditationNumber", label: "Accreditation Number (optional)" },
            { name: "website", label: "Website (optional)" },
          ] as const
        ).map(({ name, label }) => (
          <div key={name} className="space-y-1">
            <label htmlFor={name} className="text-sm font-medium">{label}</label>
            <input
              id={name}
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register(name)}
            />
            {errors[name] && (
              <p className="text-xs text-destructive">{errors[name]?.message as string}</p>
            )}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          {(["latitude", "longitude"] as const).map((name) => (
            <div key={name} className="space-y-1">
              <label htmlFor={name} className="text-sm font-medium capitalize">{name} (optional)</label>
              <input
                id={name}
                type="number"
                step="any"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register(name)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
          <textarea
            id="description"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("description")}
          />
        </div>

        <button
          type="submit"
          disabled={!isDirty || updateProfile.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {updateProfile.isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
