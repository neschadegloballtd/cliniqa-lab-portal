"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLogPreAnalyticalError } from "@/hooks/usePreAnalytical";
import { REJECTION_REASON_LABELS, type RejectionReason } from "@/types/pre-analytical";
import { useTestMenu } from "@/hooks/useProfile";
import { useBookingsByContact } from "@/hooks/useBookings";
import type { TestCategory } from "@/types/profile";
import type { Booking } from "@/types/bookings";

const REJECTION_REASONS = Object.keys(REJECTION_REASON_LABELS) as RejectionReason[];

const CATEGORY_LABELS: Record<TestCategory, string> = {
  HAEMATOLOGY: "Haematology",
  MICROBIOLOGY: "Microbiology",
  CHEMISTRY: "Chemistry",
  SEROLOGY: "Serology",
  URINALYSIS: "Urinalysis",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<TestCategory, string> = {
  HAEMATOLOGY: "bg-red-100 text-red-700",
  MICROBIOLOGY: "bg-purple-100 text-purple-700",
  CHEMISTRY: "bg-blue-100 text-blue-700",
  SEROLOGY: "bg-teal-100 text-teal-700",
  URINALYSIS: "bg-amber-100 text-amber-700",
  OTHER: "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SAMPLE_COLLECTED: "bg-indigo-100 text-indigo-700",
};

const schema = z
  .object({
    patientPhone: z.string().optional(),
    patientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    patientId: z.string().optional(),
    bookingId: z.string().optional(),
    rejectionReason: z.enum(REJECTION_REASONS as [RejectionReason, ...RejectionReason[]], {
      required_error: "Rejection reason is required",
    }),
    sampleType: z.string().optional(),
    testName: z.string().min(1, "Test name is required"),
    resampleBy: z.string().optional(),
    rejectionNotes: z.string().optional(),
  });

type FormData = z.infer<typeof schema>;

export default function LogPreAnalyticalErrorPage() {
  const router = useRouter();
  const { mutateAsync: logError, isPending } = useLogPreAnalyticalError();
  const { data: testMenu } = useTestMenu();
  const activeTests = testMenu?.filter((t) => t.isActive) ?? [];

  // Contact inputs — tracked separately to drive booking search
  const [phoneSearch, setPhoneSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  // Debounced values that actually trigger the query
  const [searchPhone, setSearchPhone] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | null>(null);

  const { data: openBookings, isFetching: searchingBookings } = useBookingsByContact(
    searchPhone || undefined,
    searchEmail || undefined
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Debounce contact search
  function scheduleSearch(phone: string, email: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchPhone(phone.trim().length >= 7 ? phone.trim() : "");
      setSearchEmail(email.includes("@") ? email.trim() : "");
    }, 600);
  }

  // When a booking is selected, auto-fill test name, sample type, patientId, bookingId
  function selectBooking(booking: Booking) {
    setSelectedBooking(booking);
    setValue("bookingId", booking.id);
    setValue("patientId", booking.patientId ?? "");
    setValue("testName", booking.testName);

    // Auto-fill sampleType from test menu if test name matches
    const menuItem = activeTests.find(
      (t) => t.testName.toLowerCase() === booking.testName.toLowerCase()
    );
    if (menuItem) {
      setValue("sampleType", menuItem.sampleType);
      setSelectedCategory(menuItem.testCategory);
    } else {
      setSelectedCategory(null);
    }
  }

  function clearBookingLink() {
    setSelectedBooking(null);
    setValue("bookingId", "");
    setValue("patientId", "");
    setValue("testName", "");
    setValue("sampleType", "");
    setSelectedCategory(null);
  }

  // Clear booking link if contact changes significantly
  useEffect(() => {
    if (selectedBooking) {
      const phone = selectedBooking.pendingPatientPhone;
      const email = selectedBooking.pendingPatientEmail;
      const matchesPhone = phone && phoneSearch.trim() === phone;
      const matchesEmail = email && emailSearch.trim() === email;
      if (!matchesPhone && !matchesEmail) {
        clearBookingLink();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneSearch, emailSearch]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await logError({
        patientId: data.patientId || undefined,
        bookingId: data.bookingId || undefined,
        rejectionReason: data.rejectionReason,
        sampleType: data.sampleType || undefined,
        testName: data.testName || undefined,
        // date input gives "YYYY-MM-DD"; backend expects OffsetDateTime ISO string
        resampleBy: data.resampleBy ? `${data.resampleBy}T00:00:00Z` : undefined,
        rejectionNotes: data.rejectionNotes || undefined,
      });
      toast.success("Pre-analytical error logged");
      router.push(`/pre-analytical/${res.data?.id}`);
    } catch {
      toast.error("Failed to log error");
    }
  };

  const showBookingResults =
    !selectedBooking && (searchingBookings || (openBookings !== undefined));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <button onClick={() => router.back()} className="mb-2 text-sm text-blue-600 hover:underline">
          ← Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Log Pre-Analytical Error</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record a sample rejection or pre-analytical failure for quality tracking.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
      >
        {/* ── Patient ──────────────────────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-gray-700">
            Patient{" "}
            <span className="text-gray-400 font-normal">
              — enter phone or email to find their open bookings
            </span>
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600">Phone</label>
              <input
                type="tel"
                placeholder="+2348012345678"
                value={phoneSearch}
                onChange={(e) => {
                  setPhoneSearch(e.target.value);
                  setValue("patientPhone", e.target.value);
                  scheduleSearch(e.target.value, emailSearch);
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={emailSearch}
                onChange={(e) => {
                  setEmailSearch(e.target.value);
                  setValue("patientEmail", e.target.value);
                  scheduleSearch(phoneSearch, e.target.value);
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Booking search results */}
          {showBookingResults && (searchPhone || searchEmail) && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="mb-2 text-xs font-medium text-blue-700">
                {searchingBookings
                  ? "Searching for open bookings…"
                  : openBookings && openBookings.length > 0
                  ? `${openBookings.length} open booking${openBookings.length > 1 ? "s" : ""} found — select one to link`
                  : "No open bookings found for this contact"}
              </p>
              {!searchingBookings && openBookings && openBookings.length > 0 && (
                <div className="space-y-2">
                  {openBookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => selectBooking(b)}
                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-left text-sm hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-800">{b.testName}</span>
                        <span
                          className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {b.pendingPatientPhone ?? b.pendingPatientEmail ?? "Registered patient"} ·{" "}
                        {b.appointmentAt
                          ? new Date(b.appointmentAt).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : `Booked ${new Date(b.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected booking badge */}
          {selectedBooking && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
              <span className="text-green-600 text-sm">✓</span>
              <span className="text-sm text-green-800 font-medium">
                Linked to booking: {selectedBooking.testName}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[selectedBooking.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {selectedBooking.status.replace("_", " ")}
              </span>
              <button
                type="button"
                onClick={clearBookingLink}
                className="ml-auto text-xs text-gray-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          )}

          {/* Hidden fields */}
          <input type="hidden" {...register("patientId")} />
          <input type="hidden" {...register("bookingId")} />
          <input type="hidden" {...register("patientPhone")} />
          <input type="hidden" {...register("patientEmail")} />
        </fieldset>

        {/* ── Rejection Reason ─────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <select
            {...register("rejectionReason")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— Select reason —</option>
            {REJECTION_REASONS.map((r) => (
              <option key={r} value={r}>
                {REJECTION_REASON_LABELS[r]}
              </option>
            ))}
          </select>
          {errors.rejectionReason && (
            <p className="mt-1 text-xs text-red-600">{errors.rejectionReason.message}</p>
          )}
        </div>

        {/* ── Test & Sample ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Test Name <span className="text-red-500">*</span>
            </label>
            {selectedBooking ? (
              // Locked to the linked booking's test
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {selectedBooking.testName}
                {selectedCategory && (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[selectedCategory]}`}>
                    {CATEGORY_LABELS[selectedCategory]}
                  </span>
                )}
              </div>
            ) : activeTests.length > 0 ? (
              <select
                {...register("testName")}
                onChange={(e) => {
                  setValue("testName", e.target.value);
                  const selected = activeTests.find((t) => t.testName === e.target.value);
                  if (selected) {
                    setValue("sampleType", selected.sampleType);
                    setSelectedCategory(selected.testCategory);
                  } else {
                    setSelectedCategory(null);
                  }
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
            {!selectedBooking && selectedCategory && (
              <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[selectedCategory]}`}>
                {CATEGORY_LABELS[selectedCategory]}
              </span>
            )}
            {errors.testName && (
              <p className="mt-1 text-xs text-red-600">{errors.testName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sample Type</label>
            <input
              type="text"
              placeholder="e.g. EDTA Blood, Urine, Serum"
              {...register("sampleType")}
              readOnly={!!selectedBooking || (activeTests.length > 0 && !!selectedCategory)}
              className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                !!selectedBooking || (activeTests.length > 0 && !!selectedCategory)
                  ? "bg-gray-50 text-gray-500 cursor-default"
                  : ""
              }`}
            />
            {(!!selectedBooking || (activeTests.length > 0 && !!selectedCategory)) && (
              <p className="mt-1 text-xs text-gray-400">Auto-filled from selected test</p>
            )}
          </div>
        </div>

        {/* ── Resample By ──────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Resample By <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            {...register("resampleBy")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            Deadline by which the patient should provide a new sample.
          </p>
        </div>

        {/* ── Notes ────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            rows={3}
            placeholder="Any additional context about the rejection…"
            {...register("rejectionNotes")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
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
            {isPending ? "Logging…" : "Log Error"}
          </button>
        </div>
      </form>
    </div>
  );
}
