"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  useTestMenu,
  useCreateTestMenuItem,
  useUpdateTestMenuItem,
  useDeleteTestMenuItem,
} from "@/hooks/useProfile";
import type { TestMenuItem } from "@/types/profile";

const schema = z.object({
  testName: z.string().min(1, "Required"),
  testCategory: z.string().min(1, "Required"),
  priceKobo: z.coerce.number().int().min(0, "Must be ≥ 0"),
  turnaroundHours: z.coerce.number().int().min(1, "Must be ≥ 1"),
  sampleType: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

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
    if (editingId) {
      updateItem.mutate({ id: editingId, body: data }, { onSuccess: cancelEdit });
    } else {
      createItem.mutate(data, { onSuccess: cancelEdit });
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
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
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-border p-4 space-y-4">
          <h2 className="text-sm font-semibold">{editingId ? "Edit Test" : "New Test"}</h2>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                { name: "testName" as const, label: "Test Name", type: "text" as const },
                { name: "testCategory" as const, label: "Category", type: "text" as const },
                { name: "sampleType" as const, label: "Sample Type", type: "text" as const },
                { name: "priceKobo" as const, label: "Price (kobo)", type: "number" as const },
                { name: "turnaroundHours" as const, label: "Turnaround (hrs)", type: "number" as const },
              ]
            ).map(({ name, label, type }) => (
              <div key={name} className="space-y-1">
                <label htmlFor={name} className="text-xs font-medium">{label}</label>
                <input
                  id={name}
                  type={type}
                  className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register(name)}
                />
                {errors[name] && (
                  <p className="text-xs text-destructive">{errors[name]?.message}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createItem.isPending || updateItem.isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {(createItem.isPending || updateItem.isPending) ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
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
                {["Test Name", "Category", "Sample Type", "Price (₦)", "TAT (hrs)", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    No tests added yet.
                  </td>
                </tr>
              )}
              {items?.map((item) => (
                <tr key={item.id} className={!item.isActive ? "opacity-50" : ""}>
                  <td className="px-4 py-3 font-medium">{item.testName}</td>
                  <td className="px-4 py-3">{item.testCategory}</td>
                  <td className="px-4 py-3">{item.sampleType}</td>
                  <td className="px-4 py-3">{(item.priceKobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" })}</td>
                  <td className="px-4 py-3">{item.turnaroundHours}h</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateItem.mutate({ id: item.id, body: { isActive: !item.isActive } })}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(item)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteItem.mutate(item.id)}
                        className="text-muted-foreground hover:text-destructive"
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
