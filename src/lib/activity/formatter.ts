import { ACTIVITY_CONFIG } from "./config";
import type { ActivityEntry } from "@/types";

export function formatActivity(entry: ActivityEntry): string {
  return ACTIVITY_CONFIG[entry.action]?.label ?? entry.action.toLowerCase().replace(/_/g, " ");
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Full timestamp for the hover tooltip — e.g. "July 12, 2026, 10:43 AM".
export function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
