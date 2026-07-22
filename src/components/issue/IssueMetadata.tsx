import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { IssueStatusControl } from "./IssueStatus";
import type { IssuePriority, IssueStatus } from "@/types";

const PRIORITY_VARIANT: Record<
  IssuePriority,
  "neutral" | "warning" | "danger"
> = {
  LOW: "neutral",
  MEDIUM: "neutral",
  HIGH: "warning",
  URGENT: "danger",
};

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function IssueMetadata({
  status,
  onStatusChange,
  statusDisabled,
  priority,
  creator,
  assignee,
  createdAt,
  updatedAt,
}: {
  status: IssueStatus;
  onStatusChange: (status: IssueStatus) => void;
  statusDisabled?: boolean;
  priority: IssuePriority;
  creator: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 text-sm">
      <div>
        <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1.5">
          Status
        </p>
        <IssueStatusControl
          status={status}
          onChange={onStatusChange}
          disabled={statusDisabled}
        />
      </div>

      <div>
        <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1.5">
          Priority
        </p>
        <Badge variant={PRIORITY_VARIANT[priority]}>
          {PRIORITY_LABEL[priority]}
        </Badge>
      </div>

      <div>
        <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1.5">
          Assignee
        </p>
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={assignee.name} size="sm" tone="subtle" />
            <span className="text-text">{assignee.name}</span>
          </div>
        ) : (
          <span className="text-text-subtle">Unassigned</span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1.5">
          Created by
        </p>
        <div className="flex items-center gap-1.5">
          <Avatar name={creator.name} size="sm" tone="subtle" />
          <span className="text-text">{creator.name}</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1.5">
          Created
        </p>
        <span className="text-text-muted">{formatDate(createdAt)}</span>
      </div>

      <div>
        <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1.5">
          Updated
        </p>
        <span className="text-text-muted">{formatDate(updatedAt)}</span>
      </div>
    </div>
  );
}
