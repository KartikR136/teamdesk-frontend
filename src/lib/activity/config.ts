import {
  Building2,
  FolderPlus,
  FolderKanban,
  FilePlus,
  FileEdit,
  MessageSquarePlus,
  MessageSquare,
  MessageSquareX,
  UserPlus,
  UserCheck,
  Shield,
  UserMinus,
  CheckCircle2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { ActivityAction } from "@/types";

export interface ActivityConfigEntry {
  icon: LucideIcon;
  /** Verb phrase completing "{actor} ___" — e.g. "created a project". */
  label: string;
}

// Single source of truth for how each activity action renders — icon and
// label. Adding a new ActivityAction later means adding one entry here,
// not touching formatter.ts, ActivityItem.tsx, or any other consumer.
export const ACTIVITY_CONFIG: Record<ActivityAction, ActivityConfigEntry> = {
  ORGANIZATION_CREATED: { icon: Building2, label: "created this organization" },
  PROJECT_CREATED: { icon: FolderPlus, label: "created a project" },
  ISSUE_CREATED: { icon: FilePlus, label: "created an issue" },
  ISSUE_UPDATED: { icon: FileEdit, label: "updated an issue" },
  COMMENT_CREATED: { icon: MessageSquarePlus, label: "commented on an issue" },
  COMMENT_EDITED: { icon: MessageSquare, label: "edited a comment" },
  COMMENT_DELETED: { icon: MessageSquareX, label: "deleted a comment" },
  MEMBER_INVITED: { icon: UserPlus, label: "invited a new member" },
  MEMBER_JOINED: { icon: UserCheck, label: "joined the organization" },
  MEMBER_ROLE_CHANGED: { icon: Shield, label: "changed a member's role" },
  MEMBER_REMOVED: { icon: UserMinus, label: "removed a member" },
  DECISION_CREATED: { icon: FolderKanban, label: "recorded a decision" },
  DECISION_UPDATED: { icon: FileEdit, label: "updated a decision" },
  DECISION_STATUS_CHANGED: {
    icon: CheckCircle2,
    label: "changed a decision's status",
  },
  DECISION_DELETED: { icon: Trash2, label: "deleted a decision" },
};
