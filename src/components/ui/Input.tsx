import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border bg-surface px-3 text-sm text-text",
        "placeholder:text-text-subtle",
        "transition-colors duration-normal ease-standard",
        "focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary",
        error ? "border-danger" : "border-border hover:border-border-hover",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
