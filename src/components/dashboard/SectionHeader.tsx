import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-width section break — used between rows of the dashboard grid
 * (e.g. above "Recently Viewed Issues", which spans the full width
 * rather than sitting in a two-column widget slot). Distinct from
 * WidgetCard's CardTitle, which is scoped to a single card's header.
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between mb-3", className)}>
      <div>
        <h2 className="text-base font-semibold tracking-tight text-text">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
