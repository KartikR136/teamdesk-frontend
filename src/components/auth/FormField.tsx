"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Show password strength meter (only for type="password" on signup) */
  strengthMeter?: boolean;
}

function passwordStrength(value: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!value) return { score: 0, label: "", color: "" };
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  const map = [
    { label: "Weak", color: "bg-danger" },
    { label: "Fair", color: "bg-warning" },
    { label: "Good", color: "bg-success" },
    { label: "Strong", color: "bg-success" },
  ] as const;
  return { score: score as 0 | 1 | 2 | 3, ...map[score] };
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, id, type, error, hint, strengthMeter, className, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;
    const strength = strengthMeter && isPassword
      ? passwordStrength(String(props.value ?? ""))
      : null;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-text"
        >
          {label}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={resolvedType}
            className={cn(
              "h-10 w-full rounded-lg border bg-surface px-3.5 text-sm text-text",
              "placeholder:text-text-subtle",
              "transition-[border-color,box-shadow] duration-fast",
              "focus:outline-none focus:ring-2 focus:border-primary",
              isPassword && "pr-10",
              error
                ? "border-danger focus:ring-danger/20"
                : "border-border hover:border-border-hover focus:ring-focus-ring/20",
              className,
            )}
            aria-describedby={
              error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
            }
            aria-invalid={!!error}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "text-text-subtle hover:text-text transition-colors duration-fast",
                "focus-visible:outline-none",
              )}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {/* Password strength meter */}
        {strength && strength.label && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-normal",
                    i < strength.score ? strength.color : "bg-surface-hover",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-text-subtle">{strength.label} password</p>
          </div>
        )}

        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-xs text-text-subtle">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = "FormField";
