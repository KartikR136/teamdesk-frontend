import { ACTIVITY_CONFIG } from "@/lib/activity/config";
import {
  formatActivity,
  formatRelativeTime,
  formatAbsoluteTime,
} from "@/lib/activity/formatter";
import type { ActivityEntry } from "@/types";

export function ActivityItem({
  entry,
  compact,
  index = 0,
}: {
  entry: ActivityEntry;
  compact?: boolean;
  index?: number;
}) {
  const Icon = ACTIVITY_CONFIG[entry.action]?.icon;
  // Capped so a long feed still finishes settling in well under half a
  // second — the point is a gentle cascade, not a visible queue.
  const delayMs = Math.min(index, 8) * 35;

  return (
    <li
      className="flex items-start gap-2.5 text-sm animate-in fade-in slide-in-from-left-1 fill-mode-backwards duration-normal ease-standard"
      style={{ animationDelay: `${delayMs}ms` }}
    >
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
