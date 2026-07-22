import type { IssuePriority, IssueStatus } from "@/types";

// TODO: Replace this entire file's role with a single
// `GET /api/dashboard/home` call once the backend milestone lands.
// Every shape below is written to match that future response 1:1 —
// widgets should be able to swap `getMockDashboardData()` for
// `apiFetch<DashboardHomeResponse>("/api/dashboard/home")` with no
// change to how they consume the data.

export interface AssignedTask {
  id: string;
  title: string;
  projectName: string;
  status: IssueStatus;
  priority: IssuePriority;
  dueDate: string | null; // ISO date, null = no due date set
  estimatePoints: number | null;
  progress: number; // 0-100, derived from subtasks/checklist server-side
}

export type NotificationKind =
  | "ISSUE_ASSIGNED"
  | "COMMENT_ADDED"
  | "DECISION_APPROVED"
  | "MENTIONED"
  | "DEPLOYMENT_COMPLETED"
  | "PR_MERGED";

export interface DashboardNotification {
  id: string;
  kind: NotificationKind;
  actorName: string;
  message: string;
  createdAt: string; // ISO
  read: boolean;
  /** Related notifications collapse under one entry in the UI */
  groupCount?: number;
}

export type PRReviewUrgency = "low" | "medium" | "high";

export interface PullRequest {
  id: string;
  repo: string;
  branch: string;
  title: string;
  author: string;
  openedAt: string; // ISO
  filesChanged: number;
  mergeStatus: "clean" | "conflicts" | "checks_failing";
  urgency: PRReviewUrgency;
  url: string; // TODO: Replace with real GitHub PR URL
}

export type DeployEnvironment =
  | "production"
  | "preview"
  | "staging"
  | "development";
export type DeployStatus = "success" | "failed" | "in_progress";

export interface Deployment {
  id: string;
  environment: DeployEnvironment;
  status: DeployStatus;
  commitHash: string; // short sha
  commitMessage: string;
  durationSeconds: number;
  triggeredBy: string;
  deployedAt: string; // ISO
}

export interface BuildHealth {
  pipelineStatus: "passing" | "failing" | "running";
  latestBuildNumber: number;
  coveragePercent: number;
  testsPassing: number;
  testsFailing: number;
  avgBuildDurationSeconds: number;
  lastUpdated: string; // ISO
}

export type MeetingKind =
  | "STANDUP"
  | "SPRINT_PLANNING"
  | "DESIGN_REVIEW"
  | "BACKEND_SYNC"
  | "DEMO"
  | "RETROSPECTIVE";

export interface Meeting {
  id: string;
  kind: MeetingKind;
  title: string;
  startsAt: string; // ISO
  durationMinutes: number;
  attendeeCount: number;
}

export interface RecentlyViewedIssue {
  id: string;
  title: string;
  projectName: string;
  priority: IssuePriority;
  status: IssueStatus;
  lastViewedAt: string; // ISO
}

export interface CodingStats {
  currentStreakDays: number;
  issuesCompletedThisWeek: number;
  reviewsCompletedThisWeek: number;
  commitsThisWeek: number;
  focusHoursThisWeek: number;
}

export interface AISummary {
  headline: string; // e.g. "Today's Focus"
  bullets: string[];
  generatedAt: string; // ISO
}

export interface QuickAction {
  id: string;
  label: string;
  shortcut: string; // e.g. "C then I"
  href: string;
}

export interface DashboardHomeResponse {
  aiSummary: AISummary;
  assignedTasks: AssignedTask[];
  notifications: DashboardNotification[];
  pullRequests: PullRequest[];
  deployments: Deployment[];
  buildHealth: BuildHealth;
  meetings: Meeting[];
  recentIssues: RecentlyViewedIssue[];
  codingStats: CodingStats;
  quickActions: QuickAction[];
}

function iso(hoursOffset: number): string {
  return new Date(Date.now() + hoursOffset * 60 * 60 * 1000).toISOString();
}

/**
 * TODO: Replace with `apiFetch<DashboardHomeResponse>("/api/dashboard/home")`.
 * Kept as a plain function (not a hook) so it's a drop-in swap either
 * for a direct call inside a data-fetching effect, or wrapped in
 * whatever fetching pattern the real integration ends up using.
 */
export function getMockDashboardData(): DashboardHomeResponse {
  return {
    aiSummary: {
      headline: "Today's Focus",
      bullets: [
        "3 issues assigned to you, 1 overdue",
        "1 pull request waiting for your review",
        "Production has been healthy for 8 days",
        "Sprint ends tomorrow — 2 issues still in progress",
        "No critical blockers detected",
      ],
      generatedAt: iso(0),
    },
    assignedTasks: [
      {
        id: "task-1",
        title: "Fix cross-tenant leak in decision status webhook",
        projectName: "Core Platform",
        status: "IN_PROGRESS",
        priority: "URGENT",
        dueDate: iso(-20), // overdue
        estimatePoints: 5,
        progress: 60,
      },
      {
        id: "task-2",
        title: "Add pagination cursor validation tests",
        projectName: "Core Platform",
        status: "TODO",
        priority: "HIGH",
        dueDate: iso(48),
        estimatePoints: 3,
        progress: 0,
      },
      {
        id: "task-3",
        title: "Migrate RoleBadge to new token set",
        projectName: "Design System",
        status: "IN_REVIEW",
        priority: "MEDIUM",
        dueDate: null,
        estimatePoints: 2,
        progress: 90,
      },
    ],
    notifications: [
      {
        id: "notif-1",
        kind: "PR_MERGED",
        actorName: "Priya Nair",
        message: "merged your PR into main",
        createdAt: iso(-1),
        read: false,
      },
      {
        id: "notif-2",
        kind: "COMMENT_ADDED",
        actorName: "Diego Alvarez",
        message: 'commented on "Fix cross-tenant leak"',
        createdAt: iso(-3),
        read: false,
        groupCount: 2,
      },
      {
        id: "notif-3",
        kind: "DECISION_APPROVED",
        actorName: "Sam Whitfield",
        message: 'approved "Adopt cursor-based pagination"',
        createdAt: iso(-6),
        read: true,
      },
      {
        id: "notif-4",
        kind: "DEPLOYMENT_COMPLETED",
        actorName: "CI/CD",
        message: "deployment to production succeeded",
        createdAt: iso(-9),
        read: true,
      },
    ],
    pullRequests: [
      {
        id: "pr-1",
        repo: "teamdesk-backend",
        branch: "fix/decision-webhook-tenant-leak",
        title: "Fix cross-tenant leak in decision status webhook",
        author: "You",
        openedAt: iso(-18),
        filesChanged: 4,
        mergeStatus: "clean",
        urgency: "high",
        url: "#", // TODO: Replace with real GitHub PR URL
      },
      {
        id: "pr-2",
        repo: "teamdesk-frontend",
        branch: "feat/coding-streak-widget",
        title: "Add coding streak widget to dashboard",
        author: "Priya Nair",
        openedAt: iso(-40),
        filesChanged: 9,
        mergeStatus: "checks_failing",
        urgency: "medium",
        url: "#",
      },
    ],
    deployments: [
      {
        id: "deploy-1",
        environment: "production",
        status: "success",
        commitHash: "a3f9c1d",
        commitMessage: "Fix cursor validation on activity pagination",
        durationSeconds: 94,
        triggeredBy: "Diego Alvarez",
        deployedAt: iso(-2),
      },
      {
        id: "deploy-2",
        environment: "preview",
        status: "success",
        commitHash: "9b21e4a",
        commitMessage: "Add coding streak widget to dashboard",
        durationSeconds: 61,
        triggeredBy: "Priya Nair",
        deployedAt: iso(-5),
      },
      {
        id: "deploy-3",
        environment: "staging",
        status: "failed",
        commitHash: "77cddf2",
        commitMessage: "Bump prisma to 6.2, regenerate client",
        durationSeconds: 112,
        triggeredBy: "Sam Whitfield",
        deployedAt: iso(-14),
      },
    ],
    buildHealth: {
      pipelineStatus: "passing",
      latestBuildNumber: 482,
      coveragePercent: 87,
      testsPassing: 341,
      testsFailing: 0,
      avgBuildDurationSeconds: 118,
      lastUpdated: iso(-1),
    },
    meetings: [
      {
        id: "meet-1",
        kind: "STANDUP",
        title: "Daily Standup",
        startsAt: iso(1),
        durationMinutes: 15,
        attendeeCount: 6,
      },
      {
        id: "meet-2",
        kind: "DESIGN_REVIEW",
        title: "Design Review — Decision Log v2",
        startsAt: iso(4),
        durationMinutes: 45,
        attendeeCount: 4,
      },
      {
        id: "meet-3",
        kind: "SPRINT_PLANNING",
        title: "Sprint Planning",
        startsAt: iso(26),
        durationMinutes: 60,
        attendeeCount: 8,
      },
    ],
    recentIssues: [
      {
        id: "issue-101",
        title: "Cursor pagination breaks on empty result page",
        projectName: "Core Platform",
        priority: "HIGH",
        status: "IN_REVIEW",
        lastViewedAt: iso(-1),
      },
      {
        id: "issue-102",
        title: "RoleBadge weight scale unclear on colorblind mode",
        projectName: "Design System",
        priority: "LOW",
        status: "TODO",
        lastViewedAt: iso(-5),
      },
      {
        id: "issue-103",
        title: "Decision Log entry export as PDF",
        projectName: "Core Platform",
        priority: "MEDIUM",
        status: "TODO",
        lastViewedAt: iso(-22),
      },
    ],
    codingStats: {
      currentStreakDays: 12,
      issuesCompletedThisWeek: 5,
      reviewsCompletedThisWeek: 3,
      commitsThisWeek: 27,
      focusHoursThisWeek: 22,
    },
    quickActions: [
      { id: "qa-1", label: "Create Issue", shortcut: "C then I", href: "#" },
      { id: "qa-2", label: "Create Project", shortcut: "C then P", href: "#" },
      {
        id: "qa-3",
        label: "Decision Log",
        shortcut: "G then D",
        href: "/dashboard/decisions",
      },
      {
        id: "qa-4",
        label: "Invite Member",
        shortcut: "G then M",
        href: "/dashboard/members",
      },
      { id: "qa-5", label: "Search Issues", shortcut: "⌘K", href: "#" },
    ],
  };
}
