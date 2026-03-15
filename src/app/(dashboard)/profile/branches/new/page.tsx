"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreateBranch } from "@/hooks/useBranch";
import type { CreateBranchRequest } from "@/types/branch";

export default function NewBranchPage() {
  const router = useRouter();
  const createBranch = useCreateBranch();

  const { register, handleSubmit, formState: { errors } } = useForm<CreateBranchRequest>();

  function onSubmit(data: CreateBranchRequest) {
    createBranch.mutate(data, {
      onSuccess: () => router.push("/profile/branches"),
    });
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Link
        href="/profile/branches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Branches
      </Link>

      <h1 className="text-2xl font-bold">Add Branch</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Branch Name *</label>
          <input
            {...register("branchName", { required: "Branch name is required" })}
            placeholder="e.g. Victoria Island Branch"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.branchName && (
            <p className="mt-1 text-xs text-destructive">{errors.branchName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            {...register("phone")}
            placeholder="+2348012345678"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Street Address</label>
          <input
            {...register("addressStreet")}
            placeholder="15 Adeola Odeku Street"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              {...register("addressCity")}
              placeholder="Lagos"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input
              {...register("addressState")}
              placeholder="Lagos State"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">LGA</label>
          <input
            {...register("addressLga")}
            placeholder="Eti-Osa"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {createBranch.isError && (
          <p className="text-sm text-destructive">Failed to create branch. Please try again.</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createBranch.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createBranch.isPending ? "Creating…" : "Create Branch"}
          </button>
          <Link
            href="/profile/branches"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
