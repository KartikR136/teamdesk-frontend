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
