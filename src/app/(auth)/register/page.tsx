"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRegister } from "@/hooks/useAuth";

const schema = z.object({
  labName: z.string().min(2, "Lab name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Register Your Lab</h1>
          <p className="text-muted-foreground mt-1">Create a Cliniqa lab partner account</p>
        </div>

        <form onSubmit={handleSubmit((data) => register_.mutate(data))} className="space-y-4">
          {(
            [
              { name: "labName", label: "Lab Name", type: "text" },
              { name: "email", label: "Email", type: "email" },
              { name: "password", label: "Password", type: "password" },
              { name: "phone", label: "Phone Number", type: "tel" },
              { name: "city", label: "City", type: "text" },
              { name: "state", label: "State", type: "text" },
            ] as const
          ).map(({ name, label, type }) => (
            <div key={name} className="space-y-1">
              <label htmlFor={name} className="text-sm font-medium">{label}</label>
              <input
                id={name}
                type={type}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register(name)}
              />
              {errors[name] && (
                <p className="text-xs text-destructive">{errors[name]?.message}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={register_.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {register_.isPending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
