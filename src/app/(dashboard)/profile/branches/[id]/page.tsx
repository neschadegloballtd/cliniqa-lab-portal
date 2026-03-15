"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { useBranch, useUpdateBranch, useBranchHours, useSetBranchHours, useBranchStaff, useAssignStaff, useRemoveStaff } from "@/hooks/useBranch";
import { useStaffList } from "@/hooks/useStaff";
import type { UpdateBranchRequest } from "@/types/branch";
import type { OperatingHoursEntry } from "@/types/profile";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_HOURS: OperatingHoursEntry[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: (i + 1) as OperatingHoursEntry["dayOfWeek"],
  opensAt: "08:00",
  closesAt: "17:00",
  isClosed: i >= 5,
}));

type HoursForm = { hours: OperatingHoursEntry[] };

export default function EditBranchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: branch, isLoading } = useBranch(id);
  const updateBranch = useUpdateBranch(id);
  const { data: hours, isLoading: hoursLoading } = useBranchHours(id);
  const setHours = useSetBranchHours(id);
  const { data: branchStaff } = useBranchStaff(id);
  const { data: allStaff } = useStaffList();
  const assignStaff = useAssignStaff(id);
  const removeStaff = useRemoveStaff(id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateBranchRequest>();
  const hoursForm = useForm<HoursForm>({ defaultValues: { hours: DEFAULT_HOURS } });

  useEffect(() => {
    if (branch) {
      reset({
        branchName: branch.branchName,
        phone: branch.phone ?? "",
        addressStreet: branch.addressStreet ?? "",
        addressCity: branch.addressCity ?? "",
        addressState: branch.addressState ?? "",
        addressLga: branch.addressLga ?? "",
      });
    }
  }, [branch, reset]);

  useEffect(() => {
    if (hours && hours.length === 7) {
      const sorted = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      hoursForm.reset({ hours: sorted });
    }
  }, [hours, hoursForm]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!branch) return <p className="text-sm text-destructive">Branch not found.</p>;

  const assignedIds = new Set(branchStaff?.map((s) => s.staffId) ?? []);
  const unassignedStaff = allStaff?.filter((s) => s.isActive && !assignedIds.has(s.id)) ?? [];

  const watchedHours = hoursForm.watch("hours");

  return (
    <div className="space-y-8 max-w-lg">
      <Link
        href="/profile/branches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Branches
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{branch.branchName}</h1>
        {branch.isHeadquarters && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
            Headquarters
          </span>
        )}
      </div>

      {/* ── Branch Details ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Branch Details</h2>
        <form
          onSubmit={handleSubmit((data) =>
            updateBranch.mutate(data, { onSuccess: () => router.push("/profile/branches") })
          )}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Branch Name *</label>
            <input
              {...register("branchName", { required: "Required" })}
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Street Address</label>
            <input
              {...register("addressStreet")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                {...register("addressCity")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                {...register("addressState")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">LGA</label>
            <input
              {...register("addressLga")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={updateBranch.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateBranch.isPending ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* ── Operating Hours ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Operating Hours</h2>
        {hoursLoading ? (
          <p className="text-sm text-muted-foreground">Loading hours…</p>
        ) : (
          <form
            onSubmit={hoursForm.handleSubmit(({ hours: h }) => setHours.mutate(h))}
            className="space-y-3"
          >
            {DAY_NAMES.map((day, i) => {
              const isClosed = watchedHours?.[i]?.isClosed ?? false;
              return (
                <div key={day} className="flex items-center gap-4 rounded-lg border border-border px-4 py-3">
                  <span className="w-24 text-sm font-medium">{day}</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={(e) => hoursForm.setValue(`hours.${i}.isClosed`, e.target.checked)}
                      className="rounded"
                    />
                    Closed
                  </label>
                  {!isClosed && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        {...hoursForm.register(`hours.${i}.opensAt`)}
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <input
                        type="time"
                        className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        {...hoursForm.register(`hours.${i}.closesAt`)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="submit"
              disabled={setHours.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {setHours.isPending ? "Saving…" : "Save Hours"}
            </button>
          </form>
        )}
      </section>

      {/* ── Staff Assignments ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Staff Assigned to This Branch</h2>

        {branchStaff && branchStaff.length > 0 ? (
          <ul className="space-y-2">
            {branchStaff.map((member) => (
              <li
                key={member.staffId}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-muted-foreground">{member.email} · {member.role}</p>
                </div>
                <button
                  onClick={() => removeStaff.mutate(member.staffId)}
                  disabled={removeStaff.isPending}
                  className="text-xs text-destructive hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No staff assigned yet.</p>
        )}

        {unassignedStaff.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Assign Staff</p>
            <div className="flex flex-wrap gap-2">
              {unassignedStaff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => assignStaff.mutate(s.id)}
                  disabled={assignStaff.isPending}
                  className="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                >
                  + {s.firstName} {s.lastName}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
