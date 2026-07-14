import { ACTIVITY_CONFIG } from "@/lib/activity/config";
import { formatActivity, formatRelativeTime, formatAbsoluteTime } from "@/lib/activity/formatter";
import type { ActivityEntry } from "@/types";

export function ActivityItem({
  entry,
  compact,
}: {
  entry: ActivityEntry;
  compact?: boolean;
}) {
  const Icon = ACTIVITY_CONFIG[entry.action]?.icon;

  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        className={`flex items-center justify-center rounded-md bg-surface-hover text-text-subtle shrink-0 ${
          compact ? "h-6 w-6 mt-0" : "h-7 w-7 mt-0"
        }`}
      >
        {Icon && <Icon size={compact ? 12 : 14} />}
      </span>
      <span className="flex-1 text-text">
        <span className="font-medium">{entry.user.name}</span>{" "}
        <span className="text-text-muted">{formatActivity(entry)}</span>
      </span>
      <span
        className="text-xs text-text-subtle shrink-0"
        title={formatAbsoluteTime(entry.createdAt)}
      >
        {formatRelativeTime(entry.createdAt)}
      </span>
    </li>
  );
}
