import { Inbox } from "lucide-react";
import { ActivityGroup } from "./ActivityGroup";
import { groupActivitiesByDate } from "@/lib/activity/grouping";
import type { ActivityEntry } from "@/types";

export function ActivityList({
  entries,
  compact,
}: {
  entries: ActivityEntry[];
  /** Smaller icons/spacing for the dashboard preview. Full page omits this. */
  compact?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Inbox size={22} className="mx-auto text-text-subtle mb-2" />
        <p className="text-sm text-text-muted">No activity yet.</p>
        <p className="text-xs text-text-subtle mt-0.5">
          Actions across your workspace will appear here.
        </p>
      </div>
    );
  }

  const groups = groupActivitiesByDate(entries);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <ActivityGroup key={group.label} group={group} compact={compact} />
      ))}
    </div>
  );
}
