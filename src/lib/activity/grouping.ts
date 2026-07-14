import type { ActivityEntry } from "@/types";

export type ActivityGroupLabel = "Today" | "Yesterday" | "Last 7 Days" | "Earlier";

const GROUP_ORDER: ActivityGroupLabel[] = ["Today", "Yesterday", "Last 7 Days", "Earlier"];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function classify(iso: string): ActivityGroupLabel {
  const entryDate = new Date(iso);
  const now = new Date();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(entryDate, now)) return "Today";
  if (isSameDay(entryDate, yesterday)) return "Yesterday";

  const daysAgo = Math.floor((now.getTime() - entryDate.getTime()) / 86400000);
  if (daysAgo <= 7) return "Last 7 Days";
  return "Earlier";
}

export interface ActivityGroup {
  label: ActivityGroupLabel;
  items: ActivityEntry[];
}

export function groupActivitiesByDate(entries: ActivityEntry[]): ActivityGroup[] {
  return GROUP_ORDER.map((label) => ({
    label,
    items: entries.filter((e) => classify(e.createdAt) === label),
  })).filter((g) => g.items.length > 0);
}
