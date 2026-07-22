import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Icon or illustration — pass a Lucide icon element or an SVG */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Primary action (e.g. a Button) */
  action?: ReactNode;
  /** Secondary link or text */
  secondaryAction?: ReactNode;
  className?: string;
  /** compact reduces vertical padding — for use inside cards */
  compact?: boolean;
}

/**
 * Reusable empty state. Every screen that can be empty uses this rather
 * than ad-hoc empty divs — ensures consistent spacing, tone, and
 * visual language throughout the product.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10 px-6" : "py-16 px-8",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-text-subtle opacity-60">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
      {secondaryAction && (
        <div className="mt-2 text-xs text-text-subtle">{secondaryAction}</div>
      )}
    </div>
  );
}

/** Dashed-border card wrapper for EmptyState inside a card boundary */
export function EmptyStateCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed border-border bg-surface",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
