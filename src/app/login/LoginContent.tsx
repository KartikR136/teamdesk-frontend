"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  const isExpired = params.get("expired") === "1";
  const isReset = params.get("reset") === "1";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your workspace"
      footer={
        <>
          No account?{" "}
          <Link
            href="/signup"
            className="text-primary hover:text-primary-hover font-semibold transition-colors"
          >
            Create one free
          </Link>
        </>
      }
    >
      {/* Status banners */}
      {isExpired && (
        <div className={cn(
          "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 mb-5",
          "bg-warning-subtle border-warning/20 text-warning text-sm",
        )}>
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          Your session expired. Please sign in again.
        </div>
      )}
      {isReset && (
        <div className={cn(
          "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 mb-5",
          "bg-success-subtle border-success/20 text-success text-sm",
        )}>
          <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
          Password updated — sign in with your new password.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:text-primary-hover transition-colors self-end"
          >
            Forgot password?
          </Link>
        </div>

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
          rightIcon={!submitting ? <ArrowRight size={15} /> : undefined}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        {/* OAuth stubs — placeholder only, no backend endpoint */}
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-text-subtle">or continue with</span>
          </div>
        </div>

        <button
          type="button"
          disabled
          className={cn(
            "relative flex items-center justify-center gap-2.5 h-10 w-full rounded-lg",
            "border border-border bg-surface text-sm font-medium text-text-muted",
            "opacity-50 cursor-not-allowed",
          )}
          title="Coming soon"
          aria-label="Sign in with Google — coming soon"
        >
          {/* Google icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
          <span className="absolute right-3 text-[10px] bg-surface-hover border border-border rounded px-1.5 py-0.5 text-text-subtle">
            soon
          </span>
        </button>
      </form>
    </AuthShell>
  );
}
