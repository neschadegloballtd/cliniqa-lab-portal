"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateBooking } from "@/hooks/useBookings";
import { useTestMenu } from "@/hooks/useProfile";

const schema = z
  .object({
    patientPhone: z.string().optional(),
    patientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    testName: z.string().min(1, "Test name is required"),
    testCategory: z.string().optional(),
    appointmentAt: z.string().optional(),
    patientNotes: z.string().optional(),
  })
  .refine((d) => d.patientPhone || d.patientEmail, {
    message: "Phone or email is required",
    path: ["patientPhone"],
  });

type FormData = z.infer<typeof schema>;

export default function NewBookingPage() {
  const router = useRouter();
  const { mutateAsync: createBooking, isPending } = useCreateBooking();
  const { data: testMenu } = useTestMenu();
  const activeTests = testMenu?.filter((t) => t.isActive) ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await createBooking({
        patientPhone: data.patientPhone || undefined,
        patientEmail: data.patientEmail || undefined,
        testName: data.testName,
        testCategory: data.testCategory || undefined,
        appointmentAt: data.appointmentAt || undefined,
        patientNotes: data.patientNotes || undefined,
      });
      toast.success("Booking created");
      router.push(`/bookings/${res.data?.id}`);
    } catch {
      toast.error("Failed to create booking");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm text-blue-600 hover:underline"
        >
          ← Back to Bookings
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">New Booking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a booking for a patient. At least phone or email is required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        {/* Patient */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Patient</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                placeholder="+2348012345678"
                {...register("patientPhone")}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.patientPhone && (
                <p className="mt-1 text-xs text-red-600">{errors.patientPhone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="patient@example.com"
                {...register("patientEmail")}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.patientEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.patientEmail.message}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">Provide phone or email (or both) to identify the patient.</p>
        </fieldset>

        {/* Test */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Test Details</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Name *</label>
              {activeTests.length > 0 ? (
                <select
                  {...register("testName")}
                  onChange={(e) => {
                    setValue("testName", e.target.value);
                    const selected = activeTests.find((t) => t.testName === e.target.value);
                    if (selected) setValue("testCategory", selected.testCategory);
                  }}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Select test —</option>
                  {activeTests.map((t) => (
                    <option key={t.id} value={t.testName}>
                      {t.testName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Full Blood Count"
                  {...register("testName")}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
              {errors.testName && (
                <p className="mt-1 text-xs text-red-600">{errors.testName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                placeholder="e.g. Haematology"
                {...register("testCategory")}
                readOnly={activeTests.length > 0}
                className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  activeTests.length > 0 ? "bg-gray-50 text-gray-500 cursor-default" : ""
                }`}
              />
              {activeTests.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">Auto-filled from selected test</p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Appointment */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Schedule</legend>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Appointment Date & Time <span className="text-gray-400 font-normal">(optional — leave blank for walk-in)</span>
            </label>
            <input
              type="datetime-local"
              {...register("appointmentAt")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </fieldset>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            rows={3}
            placeholder="Any additional notes for the lab team…"
            {...register("patientNotes")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
