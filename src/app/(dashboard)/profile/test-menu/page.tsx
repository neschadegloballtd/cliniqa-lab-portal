"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import {
  useTestMenu,
  useCreateTestMenuItem,
  useUpdateTestMenuItem,
  useDeleteTestMenuItem,
} from "@/hooks/useProfile";
import type { TestMenuItem } from "@/types/profile";

const CATEGORIES = [
  { value: "HAEMATOLOGY", label: "Haematology" },
  { value: "MICROBIOLOGY", label: "Microbiology" },
  { value: "CHEMISTRY", label: "Chemistry" },
  { value: "SEROLOGY", label: "Serology" },
  { value: "URINALYSIS", label: "Urinalysis" },
  { value: "OTHER", label: "Other" },
] as const;

// Common lab units grouped by category for the datalist
const COMMON_UNITS = [
  "g/dL", "g/L", "mg/dL", "mg/L", "µg/dL", "µg/L", "ng/mL", "pg/mL",
  "mmol/L", "µmol/L", "nmol/L", "pmol/L",
  "U/L", "IU/L", "mIU/mL", "mIU/L",
  "cells/µL", "×10³/µL", "×10⁶/µL", "×10⁹/L",
  "%", "ratio", "titre",
  "mEq/L", "mosm/kg", "mm/hr", "sec", "INR",
  "kPa", "mmHg", "pH",
];

const schema = z.object({
  testName: z.string().min(1, "Required"),
  testCategory: z.string().min(1, "Required"),
  unit: z.string().optional().nullable(),
  priceKobo: z.coerce.number().int().min(0, "Must be ≥ 0"),
  turnaroundHours: z.coerce.number().int().min(1, "Must be ≥ 1"),
  sampleType: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default function TestMenuPage() {
  const { data: items, isLoading } = useTestMenu();
  const createItem = useCreateTestMenuItem();
  const updateItem = useUpdateTestMenuItem();
  const deleteItem = useDeleteTestMenuItem();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function startEdit(item: TestMenuItem) {
    setEditingId(item.id);
    setShowAddForm(false);
    reset({
      testName: item.testName,
      testCategory: item.testCategory,
      unit: item.unit ?? "",
      priceKobo: item.priceKobo,
      turnaroundHours: item.turnaroundHours,
      sampleType: item.sampleType,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAddForm(false);
    reset();
  }

  function onSubmit(data: FormData) {
    const payload = { ...data, unit: data.unit || null };
    if (editingId) {
      updateItem.mutate({ id: editingId, body: payload }, { onSuccess: cancelEdit });
    } else {
      createItem.mutate(payload, { onSuccess: cancelEdit });
    }
  }

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Menu</h1>
        {!showAddForm && !editingId && (
          <button
            onClick={() => { setShowAddForm(true); reset(); }}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Test
          </button>
        )}
      </div>

      {(showAddForm || editingId) && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-lg border border-border bg-card p-5 space-y-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold">{editingId ? "Edit Test" : "New Test"}</h2>

          {/* Row 1: name + category + unit */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="testName" className="text-xs font-medium">Test Name *</label>
              <input
                id="testName"
                type="text"
                placeholder="e.g. Haemoglobin"
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("testName")}
              />
              {errors.testName && <p className="text-xs text-destructive">{errors.testName.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="testCategory" className="text-xs font-medium">Category *</label>
              <select
                id="testCategory"
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("testCategory")}
              >
                <option value="">— Select category —</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.testCategory && <p className="text-xs text-destructive">{errors.testCategory.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="unit" className="text-xs font-medium">
                Unit <span className="text-muted-foreground font-normal">(e.g. g/dL, mmol/L)</span>
              </label>
              <input
                id="unit"
                type="text"
                list="unit-suggestions"
                placeholder="e.g. g/dL"
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("unit")}
              />
              <datalist id="unit-suggestions">
                {COMMON_UNITS.map((u) => <option key={u} value={u} />)}
              </datalist>
            </div>
          </div>

          {/* Row 2: sample type + price + TAT */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="sampleType" className="text-xs font-medium">Sample Type *</label>
              <input
                id="sampleType"
                type="text"
                placeholder="e.g. Whole blood, Serum"
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("sampleType")}
              />
              {errors.sampleType && <p className="text-xs text-destructive">{errors.sampleType.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="priceKobo" className="text-xs font-medium">Price (kobo) *</label>
              <input
                id="priceKobo"
                type="number"
                min={0}
                placeholder="e.g. 500000 = ₦5,000"
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("priceKobo")}
              />
              {errors.priceKobo && <p className="text-xs text-destructive">{errors.priceKobo.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="turnaroundHours" className="text-xs font-medium">Turnaround (hrs) *</label>
              <input
                id="turnaroundHours"
                type="number"
                min={1}
                placeholder="e.g. 24"
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("turnaroundHours")}
              />
              {errors.turnaroundHours && <p className="text-xs text-destructive">{errors.turnaroundHours.message}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                {["Test Name", "Category", "Unit", "Sample Type", "Price (₦)", "TAT", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No tests added yet. Click <strong>Add Test</strong> to get started.
                  </td>
                </tr>
              )}
              {items?.map((item) => (
                <tr key={item.id} className={!item.isActive ? "opacity-50" : ""}>
                  <td className="px-4 py-3 font-medium">{item.testName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{categoryLabel(item.testCategory)}</td>
                  <td className="px-4 py-3">
                    {item.unit ? (
                      <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs font-mono text-blue-700">
                        {item.unit}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.sampleType}</td>
                  <td className="px-4 py-3">
                    {(item.priceKobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.turnaroundHours}h</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateItem.mutate({ id: item.id, body: { isActive: !item.isActive } })}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                        item.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteItem.mutate(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
