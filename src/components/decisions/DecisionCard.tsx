import Link from "next/link";
import { ChevronRight, FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DecisionStatusBadge } from "./DecisionStatusBadge";
import { cn } from "@/lib/utils";
import type { DecisionListItem } from "@/types";

// A decision's lifecycle status becomes a colored "spine" on the left
// edge of its entry — like a tab on a physical record — rather than
// living only inside the badge on the right. It's the same semantic
// colors DecisionStatusBadge already uses (success/warning/muted), just
// surfaced as the row's own identity instead of a label you have to
// read. This is a different idea from Issue's stage dial on purpose:
// a decision doesn't progress through stages in order the way an issue
// does, so a "fill level" would misrepresent it. A spine just says
// "here is a record, and here is its current standing" — appropriate
// for a log, not a workflow.
const SPINE_STYLES: Record<DecisionListItem["status"], string> = {
  DRAFT: "before:bg-border",
  ACCEPTED: "before:bg-success",
  SUPERSEDED: "before:bg-warning",
  ARCHIVED: "before:bg-border",
};

/**
 * A single row in the decision list. Deliberately not a giant card with
 * every field — per PRD 1's "avoid giant floating cards" and PRD 3's
 * table-vs-card guidance, this shows exactly what helps someone decide
 * whether to open it: title, status, author, and (if set) the related
 * project — not the full problem statement or trade-offs.
 */
export function DecisionCard({
  decision,
  index = 0,
}: {
  decision: DecisionListItem;
  index?: number;
}) {
  return (
    <Link
      href={`/dashboard/decisions/${decision.id}`}
      className="block animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards duration-normal ease-standard"
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
    >
      <Card
        className={cn(
          "group relative pl-5 pr-4 py-4 overflow-hidden hover:border-border-hover hover:shadow-sm hover:-translate-y-0.5 transition-all duration-normal",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]",
          SPINE_STYLES[decision.status],
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-text group-hover:text-primary transition-colors truncate">
              {decision.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-text-subtle">
              <span>{decision.author.name}</span>
              {decision.project && (
                <>
                  <span className="text-border" aria-hidden="true">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban size={12} />
                    {decision.project.name}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DecisionStatusBadge status={decision.status} />
            <ChevronRight
              size={16}
              className="text-text-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all"
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
