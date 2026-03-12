"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";

interface PatientLookupFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
}

/**
 * Shared patient lookup fields (phone OR email) used by all three push tabs.
 */
export default function PatientLookupFields({ register, errors }: PatientLookupFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700">Patient Phone</label>
        <input
          type="tel"
          placeholder="+2348012345678"
          {...register("patientPhone")}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.patientPhone && (
          <p className="mt-1 text-xs text-red-600">{String(errors.patientPhone.message)}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Patient Email</label>
        <input
          type="email"
          placeholder="patient@example.com"
          {...register("patientEmail")}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.patientEmail && (
          <p className="mt-1 text-xs text-red-600">{String(errors.patientEmail.message)}</p>
        )}
      </div>
      <p className="col-span-full text-xs text-gray-500">At least one of phone or email is required.</p>
    </div>
  );
}
