"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useVerifyOtp, useResendOtp } from "@/hooks/useAuth";

const schema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type FormData = z.infer<typeof schema>;

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground mt-1">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit(({ otp }) => verifyOtp.mutate({ email, otp }))}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label htmlFor="otp" className="text-sm font-medium">OTP Code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("otp")}
            />
            {errors.otp && (
              <p className="text-xs text-destructive">{errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={verifyOtp.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {verifyOtp.isPending ? "Verifying…" : "Verify OTP"}
          </button>
        </form>

        <button
          onClick={() => resendOtp.mutate({ email })}
          disabled={resendOtp.isPending}
          className="w-full text-sm text-primary hover:underline disabled:opacity-50"
        >
          {resendOtp.isPending ? "Resending…" : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
