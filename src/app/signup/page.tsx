"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(form.email, form.password, form.name);
      router.push("/onboarding");
    } catch {
      setError("Could not create account. That email may already be in use.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start tracking work in minutes — free forever"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover font-semibold transition-colors"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Full name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <FormField
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="ada@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          strengthMeter
        />

        {error && (
          <div
            className={cn(
              "flex items-center gap-2 text-sm text-danger",
              "bg-danger-subtle border border-danger/20 rounded-lg px-3.5 py-2.5",
            )}
            role="alert"
          >
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full mt-1"
          loading={submitting}
          rightIcon={!submitting ? <ArrowRight size={15} /> : undefined}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-xs text-text-subtle mt-1">
          By creating an account you agree to our{" "}
          <span className="underline cursor-default">Terms</span> and{" "}
          <span className="underline cursor-default">Privacy Policy</span>.
        </p>
      </form>
    </AuthShell>
  );
}
