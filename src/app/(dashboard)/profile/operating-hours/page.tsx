"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useOperatingHours, useUpdateOperatingHours } from "@/hooks/useProfile";
import type { OperatingHoursEntry } from "@/types/profile";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_HOURS: OperatingHoursEntry[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: (i + 1) as OperatingHoursEntry["dayOfWeek"],
  opensAt: "08:00",
  closesAt: "17:00",
  isClosed: i >= 5, // Sat + Sun closed by default
}));

type FormData = { hours: OperatingHoursEntry[] };

export default function OperatingHoursPage() {
  const { data, isLoading } = useOperatingHours();
  const updateHours = useUpdateOperatingHours();

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>({
    defaultValues: { hours: DEFAULT_HOURS },
  });

  const { fields } = useFieldArray({ control: undefined as never, name: "hours" });
  void fields; // used for rendering below via watch

  const hours = watch("hours");

  useEffect(() => {
    if (data && data.length === 7) {
      const sorted = [...data].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      reset({ hours: sorted });
    }
  }, [data, reset]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Operating Hours</h1>

      <form
        onSubmit={handleSubmit(({ hours: h }) => updateHours.mutate(h))}
        className="space-y-3"
      >
        {DAY_NAMES.map((day, i) => {
          const isClosed = hours?.[i]?.isClosed ?? false;
          return (
            <div key={day} className="flex items-center gap-4 rounded-lg border border-border px-4 py-3">
              <span className="w-24 text-sm font-medium">{day}</span>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isClosed}
                  onChange={(e) => setValue(`hours.${i}.isClosed`, e.target.checked)}
                  className="rounded"
                />
                Closed
              </label>

              {!isClosed && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    {...register(`hours.${i}.opensAt`)}
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <input
                    type="time"
                    className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    {...register(`hours.${i}.closesAt`)}
                  />
                </div>
              )}
            </div>
          );
        })}

        <button
          type="submit"
          disabled={updateHours.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {updateHours.isPending ? "Saving…" : "Save Hours"}
        </button>
      </form>
    </div>
  );
}
