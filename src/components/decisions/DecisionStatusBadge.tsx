import { cn } from "@/lib/utils";
import { DECISION_STATUS_METADATA } from "@/lib/decisions";
import type { DecisionStatus } from "@/types";

/**
 * A plain, non-interactive status badge — used in list views where the
 * status is read-only context, not something this screen changes.
 * Distinct from DecisionStatusControl (the interactive dropdown used on
 * the detail page), same split IssueStatus.tsx doesn't need because
 * issue status only ever appears as an interactive control. Here, the
 * list page needs a badge and the detail page needs a control — two
 * real, different use cases, not duplicated code.
 */
export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  const meta = DECISION_STATUS_METADATA[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium tracking-wide",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
