import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-surface-hover text-text-muted border border-border",
        subtle:  "bg-primary-subtle text-primary-subtle-text",
        solid:   "bg-primary text-white",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        danger:  "bg-danger-subtle text-danger",
        info:    "bg-info-subtle text-info",
        outline: "border border-current bg-transparent",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Shows a colored dot before the label */
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ className, variant, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", dotColor ?? "bg-current")}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
