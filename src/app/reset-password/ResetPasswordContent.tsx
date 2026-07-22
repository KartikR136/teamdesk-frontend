"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) { setError("This link is missing its reset token."); return; }
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      router.push("/login?reset=1");
    } catch {
      setError("This link is invalid or has expired. Request a new one.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This link is missing a required token"
        footer={
          <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-medium transition-colors">
            <ArrowLeft size={13} /> Request a new link
          </Link>
        }
      >
        <div className={cn(
          "flex items-start gap-2.5 rounded-xl border px-3.5 py-3",
          "bg-danger-subtle border-danger/20 text-danger text-sm",
        )}>
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          Request a new password reset link from the sign-in page.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Your new password must be at least 8 characters"
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-medium transition-colors">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          strengthMeter
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-danger bg-danger-subtle border border-danger/20 rounded-lg px-3.5 py-2.5" role="alert">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full mt-1"
          loading={submitting}
          leftIcon={!submitting ? <ShieldCheck size={15} /> : undefined}
        >
          {submitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
