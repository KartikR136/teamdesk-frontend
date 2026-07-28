import {
  UserPlus,
  MessageSquare,
  AtSign,
  GitMerge,
  GitPullRequest,
  Rocket,
  XCircle,
  Wrench,
  CheckCircle2,
  Bell,
} from "lucide-react";
import type { NotificationType } from "@/lib/notificationsApi";

// Extends the dashboard widget's original 6-kind KIND_CONFIG (see
// NotificationsCard.tsx) to cover the backend's full NotificationType
// union — the dedicated Notification Center and header bell both need to
// render every type distinctly, not just the 6 the compact dashboard
// widget originally handled.
export const NOTIFICATION_VISUALS: Record<
  NotificationType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  MENTION: {
    icon: <AtSign size={13} />,
    color: "text-warning bg-warning-subtle",
    label: "Mention",
  },
  COMMENT: {
    icon: <MessageSquare size={13} />,
    color: "text-text-muted bg-surface-hover",
    label: "Comment",
  },
  ASSIGNMENT: {
    icon: <UserPlus size={13} />,
    color: "text-primary bg-primary-subtle",
    label: "Assignment",
  },
  STATUS_CHANGE: {
    icon: <CheckCircle2 size={13} />,
    color: "text-success bg-success-subtle",
    label: "Status change",
  },
  ORG_EVENT: {
    icon: <Bell size={13} />,
    color: "text-text-muted bg-surface-hover",
    label: "Organization",
  },
  PR_REVIEW_REQUESTED: {
    icon: <GitPullRequest size={13} />,
    color: "text-warning bg-warning-subtle",
    label: "Review requested",
  },
  PR_REVIEW_SUBMITTED: {
    icon: <MessageSquare size={13} />,
    color: "text-primary bg-primary-subtle",
    label: "Review submitted",
  },
  PR_MERGED: {
    icon: <GitMerge size={13} />,
    color: "text-success bg-success-subtle",
    label: "PR merged",
  },
  DEPLOYMENT_SUCCEEDED: {
    icon: <Rocket size={13} />,
    color: "text-success bg-success-subtle",
    label: "Deployment succeeded",
  },
  DEPLOYMENT_FAILED: {
    icon: <XCircle size={13} />,
    color: "text-danger bg-danger-subtle",
    label: "Deployment failed",
  },
  BUILD_FAILED: {
    icon: <Wrench size={13} />,
    color: "text-danger bg-danger-subtle",
    label: "Build failed",
  },
  BUILD_FIXED: {
    icon: <Wrench size={13} />,
    color: "text-success bg-success-subtle",
    label: "Build fixed",
  },
};

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
