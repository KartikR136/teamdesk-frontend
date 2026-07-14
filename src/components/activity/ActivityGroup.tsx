import { ActivityItem } from "./ActivityItem";
import type { ActivityGroup as ActivityGroupData } from "@/lib/activity/grouping";

export function ActivityGroup({
  group,
  compact,
}: {
  group: ActivityGroupData;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-2">
        {group.label}
      </p>
      <ul className="space-y-2.5">
        {group.items.map((entry) => (
          <ActivityItem key={entry.id} entry={entry} compact={compact} />
        ))}
      </ul>
    </div>
  );
}
