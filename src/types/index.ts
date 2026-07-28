// Shared domain types for TeamDesk.
//
// Why this file exists: before this milestone, `Role`, `PaginatedResponse<T>`,
// `Project`, `Issue`, `Comment`, `Member`, and `Invitation` were each
// redeclared locally in whichever page.tsx happened to need them. That's
// exactly the pattern that caused two real production regressions
// (M1's pagination-shape change, M2's 204-handling gap) — a shape changed
// in one place and nothing forced every consumer to notice. Centralizing
// the types doesn't make drift impossible, but it means there's exactly
// one place to update, and TypeScript will flag every call site that
// still expects the old shape.

export type Role = "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export const ROLES: Role[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

export interface PaginatedResponse<T> {
  data: T[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  /** Confirmed present on the Prisma model (default: now()) and returned
   * by GET /organizations/:id/projects — verified against the real route
   * and schema, not assumed. No updatedAt exists on this model. */
  createdAt: string;
  /** Count of non-DONE issues, added alongside the projects-list page.
   * Backend returns `_count: { issues }`; mapped to this flatter name in
   * the one place we destructure the raw response (the projects page). */
  _count?: { issues: number };
}

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const ISSUE_PRIORITIES: { value: IssuePriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export interface Issue {
  id: string;
  title: string;
  status: IssueStatus;
  projectId: string;
  assignee: { id: string; name: string } | null;
  /** Additive, optional — see prisma Sprint model. Absent on issues never
   * assigned to a sprint. */
  sprintId?: string | null;
}

// Confirmed against prisma/schema.prisma's Issue model and the new
// GET /issues/:issueId route (Milestone 7) — description, priority,
// creator, and both timestamps are all real fields, not assumed.
export interface IssueDetail extends Issue {
  description: string | null;
  priority: IssuePriority;
  creator: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export type IssueStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export const ISSUE_STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
}

export interface Member {
  userId: string;
  role: Role;
  user: { id: string; name: string; email: string };
}

export type DecisionStatus = "DRAFT" | "ACCEPTED" | "SUPERSEDED" | "ARCHIVED";

export const DECISION_STATUSES: { value: DecisionStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "SUPERSEDED", label: "Superseded" },
  { value: "ARCHIVED", label: "Archived" },
];

// Confirmed against src/routes/decisions.ts's decisionInclude and the
// backend Zod schema (decisionBodySchema) — every field here is either
// a required create-time field, an explicitly optional one, or a field
// added server-side (id, organizationId, authorId, createdAt).
export interface DecisionRelatedIssue {
  issue: { id: string; title: string; status: IssueStatus };
}

export interface Decision {
  id: string;
  title: string;
  problemStatement: string;
  context: string;
  alternatives: string;
  chosenSolution: string;
  tradeoffs: string;
  consequences: string | null;
  status: DecisionStatus;
  projectId: string | null;
  reviewDate: string | null;
  organizationId: string;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string };
  project: { id: string; name: string } | null;
  relatedIssues: DecisionRelatedIssue[];
}

// Shape returned by the list endpoint (GET /organizations/:id/decisions) —
// deliberately lighter than the full Decision type. The list route's
// Prisma `include` only selects `author` and `project`, not
// `relatedIssues` — confirmed directly against decisions.ts, not assumed.
// Modeling this as its own type (rather than reusing Decision and just
// not populating relatedIssues) means the list page can never
// accidentally try to render a field the list endpoint never sent.
export type DecisionListItem = Omit<Decision, "relatedIssues">;

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
}

// Shape returned by GET /api/invitations/me — distinct from the org-side
// Invitation above because it nests the organization, not the invitee.
export interface MyInvitation {
  id: string;
  role: Role;
  organization: { id: string; name: string; slug: string };
}

export interface User {
  id: string;
  email: string;
  name: string;
}

// CONFIRMED against src/routes/activity.ts (GET /organizations/:id/activity).
// The route does `prisma.activityLog.findMany({ include: { user: {...} } })`
// and returns the raw log rows plus that include — so `user` is confirmed,
// `action` and `createdAt` are near-certain (every Prisma model has an id
// and the M3 handoff names the action enum), but the *rest* of the
// ActivityLog model (e.g. whatever holds "which issue/project/member this
// event was about") isn't visible from this route file alone — that would
// need the Prisma schema. Modeled as optional `metadata: unknown` rather
// than guessing a field name and shape, so ActivityFeed doesn't fabricate
// specific labels ("commented on Authentication Bug") it can't actually
// back up yet.
export type ActivityAction =
  | "ORGANIZATION_CREATED"
  | "PROJECT_CREATED"
  | "ISSUE_CREATED"
  | "ISSUE_UPDATED"
  | "COMMENT_CREATED"
  | "COMMENT_EDITED"
  | "COMMENT_DELETED"
  | "MEMBER_INVITED"
  | "MEMBER_JOINED"
  | "MEMBER_ROLE_CHANGED"
  | "MEMBER_REMOVED"
  | "DECISION_CREATED"
  | "DECISION_UPDATED"
  | "DECISION_STATUS_CHANGED"
  | "DECISION_DELETED";

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  createdAt: string;
  user: { id: string; name: string };
  /** Unconfirmed shape — whatever else the ActivityLog model carries
   * (likely something identifying the affected issue/project/member).
   * Not read speculatively; see ActivityFeed.tsx's describe(). */
  metadata?: unknown;
}

// ---------------------------------------------------------------------
// Meetings — backs both the dashboard's "Today's Meetings" widget and
// the dedicated /dashboard/meetings pages. MeetingKind/MeetingSummary
// mirror the backend's dashboard.dto.ts MeetingDto field-for-field
// (same convention this file's header comment already establishes for
// every other resource here).
// ---------------------------------------------------------------------

export type MeetingKind =
  | "STANDUP"
  | "SPRINT_PLANNING"
  | "DESIGN_REVIEW"
  | "BACKEND_SYNC"
  | "DEMO"
  | "RETROSPECTIVE"
  | "ONE_ON_ONE"
  | "INCIDENT_REVIEW"
  | "OTHER";

export const MEETING_KINDS: { value: MeetingKind; label: string }[] = [
  { value: "STANDUP", label: "Standup" },
  { value: "SPRINT_PLANNING", label: "Sprint Planning" },
  { value: "DESIGN_REVIEW", label: "Design Review" },
  { value: "BACKEND_SYNC", label: "Backend Sync" },
  { value: "DEMO", label: "Demo" },
  { value: "RETROSPECTIVE", label: "Retrospective" },
  { value: "ONE_ON_ONE", label: "1:1" },
  { value: "INCIDENT_REVIEW", label: "Incident Review" },
  { value: "OTHER", label: "Other" },
];

export type MeetingRsvpStatus =
  | "INVITED"
  | "ACCEPTED"
  | "DECLINED"
  | "TENTATIVE";

export type RecurrenceRule = "NONE" | "DAILY" | "WEEKDAYS" | "WEEKLY";

export const RECURRENCE_RULES: { value: RecurrenceRule; label: string }[] = [
  { value: "NONE", label: "Does not repeat" },
  { value: "DAILY", label: "Every day" },
  { value: "WEEKDAYS", label: "Every weekday (Mon–Fri)" },
  { value: "WEEKLY", label: "Every week" },
];

/** Shape used by the dashboard's "Today's Meetings" widget — matches
 * dashboard.dto.ts's MeetingDto exactly. */
export interface MeetingSummary {
  id: string;
  kind: MeetingKind;
  title: string;
  startsAt: string;
  durationMinutes: number;
  attendeeCount: number;
  organizationId?: string;
  organizationName?: string;
  projectId?: string | null;
  projectName?: string | null;
  location?: string | null;
  myRsvpStatus?: MeetingRsvpStatus;
  isOrganizer?: boolean;
  linkedIssueCount?: number;
}

export interface MeetingAttendee {
  id: string;
  status: MeetingRsvpStatus;
  respondedAt: string | null;
  user: { id: string; name: string; email: string };
}

export interface MeetingLinkedIssue {
  id: string;
  issue: {
    id: string;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    projectId?: string;
  };
}

/** Full meeting shape returned by GET /meetings/:id and the
 * organizations/:id/meetings list — matches meetingInclude() in the
 * backend's routes/meetings.ts. */
export interface Meeting {
  id: string;
  title: string;
  kind: MeetingKind;
  description: string | null;
  startsAt: string;
  durationMinutes: number;
  location: string | null;
  notes: string | null;
  recurrenceRule: RecurrenceRule;
  seriesId: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  projectId: string | null;
  createdById: string;
  createdBy: { id: string; name: string };
  project: { id: string; name: string } | null;
  attendees: MeetingAttendee[];
  linkedIssues: MeetingLinkedIssue[];
}

// ---------------------------------------------------------------------
// Pull Requests — backs both the dashboard's "Pull Requests Awaiting
// Review" widget and the dedicated /dashboard/pull-requests pages.
// Mirrors the Meetings section above field-for-field against the
// backend's dashboard.dto.ts PullRequestDto and routes/pullRequests.ts.
// ---------------------------------------------------------------------

export type PRMergeStatus = "clean" | "conflicts" | "checks_failing";
export type PRReviewUrgency = "low" | "medium" | "high";
export type PRStatus = "OPEN" | "MERGED" | "CLOSED";
export type PRReviewStatus =
  | "PENDING"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "COMMENTED";

/** Shape used by the dashboard's "Pull Requests Awaiting Review" widget —
 * matches dashboard.dto.ts's PullRequestDto exactly. */
export interface PullRequestSummary {
  id: string;
  repo: string;
  branch: string;
  title: string;
  author: string;
  openedAt: string;
  filesChanged: number;
  mergeStatus: PRMergeStatus;
  urgency: PRReviewUrgency;
  url: string;
  organizationId?: string;
  organizationName?: string;
  projectId?: string | null;
  projectName?: string | null;
  targetBranch?: string;
  status?: PRStatus;
  linesAdded?: number;
  linesRemoved?: number;
  myReviewStatus?: PRReviewStatus;
  isAuthor?: boolean;
  linkedIssueCount?: number;
  commentCount?: number;
}

export interface PullRequestReviewer {
  id: string;
  status: PRReviewStatus;
  requestedAt: string;
  respondedAt: string | null;
  user: { id: string; name: string; email: string };
}

export interface PullRequestLinkedIssue {
  id: string;
  issue: {
    id: string;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    projectId?: string;
  };
}

export interface PullRequestComment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
}

/** Full pull request shape returned by GET /pull-requests/:id and the
 * organizations/:id/pull-requests list — matches prInclude() in the
 * backend's routes/pullRequests.ts. */
export interface PullRequest {
  id: string;
  title: string;
  description: string | null;
  repoName: string;
  sourceBranch: string;
  targetBranch: string;
  status: PRStatus;
  mergeStatus: "CLEAN" | "CONFLICTS" | "CHECKS_FAILING";
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  organizationId: string;
  projectId: string | null;
  authorId: string;
  author: { id: string; name: string; email: string };
  project: { id: string; name: string } | null;
  reviewers: PullRequestReviewer[];
  linkedIssues: PullRequestLinkedIssue[];
  _count: { comments: number };
}

// ---------------------------------------------------------------------
// Deployments — mirrors the PullRequest section above field-for-field.
// Backed by prisma's Deployment model + routes/deployments.ts.
// ---------------------------------------------------------------------

export type DeployEnvironment =
  | "PRODUCTION"
  | "PREVIEW"
  | "STAGING"
  | "DEVELOPMENT";

export type DeployStatus =
  | "QUEUED"
  | "IN_PROGRESS"
  | "SUCCESS"
  | "FAILED"
  | "ROLLED_BACK";

export type DeployHealth = "UNKNOWN" | "HEALTHY" | "DEGRADED" | "UNHEALTHY";

/** Full deployment shape returned by GET /deployments/:id and the
 * organizations/:id/deployments list — matches deploymentInclude() in the
 * backend's routes/deployments.ts. */
export interface Deployment {
  id: string;
  environment: DeployEnvironment;
  status: DeployStatus;
  health: DeployHealth;
  commitHash: string;
  commitMessage: string;
  branch: string;
  durationSeconds: number | null;
  notes: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  healthCheckedAt: string | null;
  rolledBackAt: string | null;
  organizationId: string;
  projectId: string | null;
  pullRequestId: string | null;
  triggeredById: string;
  rolledBackById: string | null;
  previousDeploymentId: string | null;
  triggeredBy: { id: string; name: string; email: string };
  rolledBackBy: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  pullRequest: {
    id: string;
    title: string;
    mergedAt: string | null;
    repoName: string;
  } | null;
  previousDeployment: {
    id: string;
    commitHash: string;
    environment: DeployEnvironment;
    createdAt: string;
  } | null;
  rollbacks: {
    id: string;
    commitHash: string;
    createdAt: string;
    status: DeployStatus;
  }[];
}

export interface DoraTierMetric {
  tier: "Elite" | "High" | "Medium" | "Low" | "Unknown";
}

export interface DoraMetrics {
  environment: DeployEnvironment;
  windowDays: number;
  totalDeployments: number;
  deploymentFrequency: { perDay: number } & DoraTierMetric;
  leadTimeForChanges: { hours: number | null; sampleSize: number } & DoraTierMetric;
  changeFailureRate: { percent: number } & DoraTierMetric;
  mttr: { hours: number | null; sampleSize: number } & DoraTierMetric;
}

// ---------------------------------------------------------------------
// Build Health — mirrors the Deployment section above field-for-field.
// Backed by prisma's BuildPipeline/BuildRun models +
// routes/buildPipelines.ts + routes/ciWebhooks.ts.
// ---------------------------------------------------------------------

export type BuildProvider =
  | "GITHUB_ACTIONS"
  | "CIRCLECI"
  | "GITLAB_CI"
  | "BUILDKITE"
  | "JENKINS"
  | "NATIVE";

export type BuildRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "PASSING"
  | "FAILING"
  | "CANCELLED";

export interface BuildPipeline {
  id: string;
  name: string;
  provider: BuildProvider;
  defaultBranch: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  projectId: string | null;
  createdById: string;
  createdBy: { id: string; name: string };
  project: { id: string; name: string } | null;
  _count: { runs: number };
  /** Only present on create/rotate responses — never on list responses. */
  webhookUrl?: string;
  /** Present on list responses instead of the secret itself. */
  hasWebhook?: boolean;
}

export interface BuildRun {
  id: string;
  buildNumber: number;
  status: BuildRunStatus;
  branch: string;
  commitHash: string;
  commitMessage: string | null;
  testsPassing: number;
  testsFailing: number;
  testsSkipped: number;
  coveragePercent: number | null;
  durationSeconds: number | null;
  flakyTestNames: string[];
  failureSummary: string | null;
  logsUrl: string | null;
  source: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  organizationId: string;
  projectId: string | null;
  pipelineId: string;
  pullRequestId: string | null;
  pipeline: { id: string; name: string; provider: BuildProvider };
  project: { id: string; name: string } | null;
  pullRequest: { id: string; title: string; repoName: string } | null;
  triggeredBy: { id: string; name: string } | null;
}

export interface BuildHealthTrendPoint {
  date: string;
  totalRuns: number;
  passRatePercent: number;
  avgCoveragePercent: number;
}

export interface BuildHealthPipelineSummary {
  id: string;
  name: string;
  provider: BuildProvider;
  isActive: boolean;
  defaultBranch: string;
  totalRuns: number;
  runsInWindow: number;
  lastStatus: BuildRunStatus | null;
  lastRunAt: string | null;
}

export interface BuildHealthAggregate {
  windowDays: number;
  latestRun: BuildRun | null;
  summary: {
    totalRuns: number;
    passing: number;
    failing: number;
    passRatePercent: number | null;
    avgCoveragePercent: number | null;
    avgDurationSeconds: number | null;
  };
  trend: BuildHealthTrendPoint[];
  flakyTests: { name: string; occurrences: number }[];
  pipelines: BuildHealthPipelineSummary[];
}

// ── Sprints — Quick Actions milestone ──────────────────────────────────
// Mirrors the Sprint model in prisma/schema.prisma exactly.

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export const SPRINT_STATUSES: { value: SprintStatus; label: string }[] = [
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
];

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  projectId: string;
  project: { id: string; name: string };
  _count: { issues: number };
}

export interface SprintProgress {
  totalIssues: number;
  doneIssues: number;
  percentComplete: number;
  totalPoints: number;
  donePoints: number;
}

export interface SprintDetail extends Sprint {
  createdBy: { id: string; name: string };
  issues: Issue[];
  progress: SprintProgress;
}
