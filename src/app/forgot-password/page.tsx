"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send a secure link to your email"
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-medium transition-colors"
        >
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      }
    >
      {submitted ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-success-subtle mb-4">
            <CheckCircle2 size={22} className="text-success" />
          </div>
          <h3 className="text-sm font-semibold text-text mb-2">Check your inbox</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            If an account exists for{" "}
            <span className="font-medium text-text">{email}</span>, a reset
            link has been sent. It expires in 1 hour.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="We'll send a link to this address if it's registered."
            required
          />
          <Button
            type="submit"
            size="lg"
            className="w-full mt-1"
            loading={submitting}
            leftIcon={!submitting ? <Mail size={15} /> : undefined}
          >
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
