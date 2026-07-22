# TeamDesk — Backend Requirements

**Status:** Living document. Single source of truth for every frontend capability currently backed by mock data or a frontend-only stub, so backend work and frontend expectations don't drift apart.

**How to read this doc:** each requirement lists the frontend component(s) already built and waiting for it, so implementing the endpoint is a data-plumbing change on the frontend, not a rebuild.

**Priority key:** Critical (blocks a shipped feature from being real) · High (expected soon) · Medium (planned, not urgent) · Future (directional, not committed).

---

## 1. Dashboard API

### 1.1 Developer Home Dashboard endpoint

- **Purpose:** Single aggregate endpoint powering the entire Developer Command Center dashboard, replacing `src/mock/dashboard.ts`.
- **Suggested endpoint:** `GET /api/dashboard/home` (auth required, scoped to current org via existing session/org-switch mechanism — no new auth model needed).
- **Expected response shape (high level):**
  ```
  {
    aiSummary: {...},
    assignedTasks: [...],
    notifications: [...],
    pullRequests: [...],
    deployments: [...],
    buildHealth: {...},
    meetings: [...],
    recentIssues: [...],
    codingStats: {...},
    quickActions: [...]
  }
  ```
  Full field-level shape already defined as TypeScript interfaces in `src/mock/dashboard.ts` (`DashboardHomeResponse` and its sub-types) — treat that file as the shape contract, not just a mock.
- **Frontend components consuming it:** `DeveloperHero`, `AISummaryCard`, `AssignedTasksCard`, `NotificationsCard`, `PullRequestsCard`, `DeploymentsCard`, `BuildHealthCard`, `MeetingsCard`, `RecentIssuesCard`, `CodingStreakCard`, `QuickActionsCard` — every widget in `components/dashboard/`.
- **Priority:** High.
- **Notes:** Could be one aggregate call, or the frontend could be trivially changed to call per-widget sub-resources (`/api/dashboard/tasks`, `/api/dashboard/notifications`, etc.) if aggregation is expensive server-side — each widget already fetches independently in its own `useEffect`, so splitting the endpoint later is a low-risk change.

### 1.2 AI summary

- **Purpose:** Natural-language "Today's Focus" bullets shown in `AISummaryCard`.
- **Suggested endpoint:** Sub-field of 1.1, or standalone `GET /api/dashboard/ai-summary` if generation is slow/expensive and should be cached or computed asynchronously.
- **Expected response shape:** `{ headline: string, bullets: string[], generatedAt: ISO8601 }`.
- **Frontend component:** `AISummaryCard`.
- **Priority:** Medium — see §7 for the actual generation approach.
- **Notes:** If generation is slow (LLM call), consider returning a cached/stale summary immediately with a `generatedAt` timestamp so the frontend can show "Updated 2h ago" rather than blocking on a live generation every dashboard load.

### 1.3 Assigned tasks

- **Purpose:** "My Assigned Tasks" widget — likely just a filtered view of existing Issues (`assigneeId = currentUser`), not a new resource.
- **Suggested endpoint:** Could reuse `GET /api/organizations/:organizationId/issues?assignee=me` if that filter doesn't already exist on the existing issues endpoint — check before building a new route.
- **Expected response shape:** Array of `{ id, title, projectName, status, priority, dueDate, estimatePoints, progress }`. Note: `dueDate`, `estimatePoints`, and `progress` are **not present on the current `Issue` type** (per `API.md`) — these are new fields this widget needs that don't exist on the Issue model today.
- **Frontend component:** `AssignedTasksCard`.
- **Priority:** High.
- **Notes:** `progress` (0–100) implies either a subtask/checklist system that doesn't exist yet, or should be dropped from the widget if out of scope — flagging this as a real product decision, not just an API detail.

### 1.4 Notifications

- **Purpose:** Read/unread, groupable notification feed — distinct from the existing `ActivityLog` (which has no read state and isn't scoped to "things relevant to me").
- **Suggested endpoint:** `GET /api/notifications` (per-user, not per-org) + `POST /api/notifications/:id/read`.
- **Expected response shape:** Array of `{ id, kind, actorName, message, createdAt, read, groupCount? }`.
- **Frontend component:** `NotificationsCard`.
- **Priority:** High.
- **Notes:** This is a genuinely new backend concept (per-user read state), not a reshaping of `ActivityLog`. Needs its own table/model.

### 1.5 Recently viewed issues

- **Purpose:** Per-user "last opened" issue history.
- **Suggested endpoint:** `GET /api/users/me/recent-issues`, populated by a `POST` or fire-and-forget ping when an issue detail page is opened (`src/app/dashboard/projects/[projectId]/issues/[issueId]/page.tsx` is the natural place to fire it).
- **Expected response shape:** Array of `{ id, title, projectName, priority, status, lastViewedAt }`.
- **Frontend component:** `RecentIssuesCard`.
- **Priority:** Medium.
- **Notes:** Needs a decision on retention (last N, or last N days) and whether it's per-user-global or per-user-per-org.

### 1.6 Coding statistics

- **Purpose:** Streak/commits/reviews/focus-hours in `CodingStreakCard`.
- **Suggested endpoint:** `GET /api/users/me/coding-stats`.
- **Expected response shape:** `{ currentStreakDays, issuesCompletedThisWeek, reviewsCompletedThisWeek, commitsThisWeek, focusHoursThisWeek }`.
- **Frontend component:** `CodingStreakCard`.
- **Priority:** Future.
- **Notes:** `commitsThisWeek` requires a Git provider integration (see §3); `focusHoursThisWeek` has no data source anywhere in the current system — needs a product decision on what "focus hours" even measures before an endpoint can be designed (manual time tracking? IDE plugin? calendar-blocked time?).

### 1.7 Quick actions metadata

- **Purpose:** Currently fully static/local in `QuickActionsCard` — no backend need identified. Listed here for completeness only.
- **Priority:** N/A — frontend-only unless per-user customizable shortcuts become a feature.

---

## 2. Search & Command Palette

**Important existing-code note:** the codebase already has a `CommandPaletteProvider` (`components/ui/CommandPalette`) wired into `DashboardShell`. The `SearchBar` component built during the Command Center milestone is a **separate, redundant entry point** that should likely be reconciled with the existing command palette rather than shipped as a second parallel system — flagging this for you to decide, not fixing it silently.

### 2.1 Global search endpoint

- **Purpose:** Backs both `SearchBar` and the existing `CommandPaletteProvider`.
- **Suggested endpoint:** `GET /api/organizations/:organizationId/search?q=` — cross-entity (issues, projects, decisions, members).
- **Expected response shape:** `{ issues: [...], projects: [...], decisions: [...], members: [...] }`, each item minimal (id, title/name, type) for a picker UI, not full records.
- **Frontend component:** `SearchBar`, `CommandPaletteProvider`.
- **Priority:** High.
- **Notes:** `API.md` explicitly states _"There is no server-side search across paginated lists — chosen deliberately."_ This is a direct, documented architectural conflict: this requirement asks for exactly what that decision ruled out. **This needs a product/architecture conversation, not just an endpoint** — resolve the tension before building.

### 2.2 Search ranking

- **Purpose:** Relevance ordering across mixed entity types.
- **Priority:** Future — not needed until 2.1 exists and result volume makes ordering matter.

### 2.3 Recent searches

- **Purpose:** Per-user search history for faster re-access.
- **Suggested endpoint:** `GET/POST /api/users/me/recent-searches`.
- **Priority:** Future.

### 2.4 Keyboard command support

- **Purpose:** Non-search actions triggerable from the palette (e.g. "Create Issue", theme toggle).
- **Priority:** Medium — this is largely a frontend wiring task once 2.1 lands, minimal new backend surface beyond existing create endpoints.

---

## 3. GitHub Integration

### 3.1 Pull requests awaiting review

- **Purpose:** `PullRequestsCard`.
- **Suggested endpoint:** `GET /api/integrations/github/pull-requests?status=awaiting-review`.
- **Expected response shape:** `{ id, repo, branch, title, author, openedAt, filesChanged, mergeStatus, urgency, url }`.
- **Frontend component:** `PullRequestsCard`.
- **Priority:** Future.
- **Notes:** Requires a GitHub App/OAuth integration (installation, webhook receiver, token storage) — this is a substantial backend project on its own, not a simple REST field. `urgency` (low/medium/high) implies either GitHub-native signals (age, requested-reviewer count) or a custom scoring rule that needs definition.

### 3.2 Review status

- **Purpose:** Merge-readiness (`clean` / `conflicts` / `checks_failing`) shown per PR.
- **Priority:** Future — bundled with 3.1, likely from the same GitHub webhook payload (`check_run`/`pull_request` events).

### 3.3 Repository metadata

- **Purpose:** Repo/branch display.
- **Priority:** Future — bundled with 3.1.

---

## 4. CI/CD Integration

### 4.1 Deployments

- **Purpose:** `DeploymentsCard` timeline.
- **Suggested endpoint:** `GET /api/deployments?limit=N`, populated via a webhook receiver from your CI/CD provider (per `DEPLOYMENT.md`, currently Render + Vercel).
- **Expected response shape:** `{ id, environment, status, commitHash, commitMessage, durationSeconds, triggeredBy, deployedAt }`.
- **Frontend component:** `DeploymentsCard`.
- **Priority:** Medium.
- **Notes:** Render and Vercel both support outgoing webhooks — this is the most achievable integration in this document; no OAuth flow needed, just a webhook receiver endpoint and a `Deployment` table.

### 4.2 Build health

- **Purpose:** `BuildHealthCard` — pipeline status, coverage, pass/fail counts.
- **Suggested endpoint:** `GET /api/ci/build-health`.
- **Expected response shape:** `{ pipelineStatus, latestBuildNumber, coveragePercent, testsPassing, testsFailing, avgBuildDurationSeconds, lastUpdated }`.
- **Frontend component:** `BuildHealthCard`.
- **Priority:** Medium.
- **Notes:** Coverage/test counts need your CI provider to export a machine-readable report (e.g. `lcov`, JUnit XML) that a webhook or scheduled job parses — not automatically available from a basic "build passed/failed" webhook alone.

### 4.3 Test status / 4.4 Coverage / 4.5 Pipeline metadata

- Bundled with 4.2 — same endpoint, same data source.

---

## 5. Calendar / Meetings

### 5.1 Daily meetings

- **Purpose:** `MeetingsCard`.
- **Suggested endpoint:** `GET /api/calendar/today`.
- **Expected response shape:** `{ id, kind, title, startsAt, durationMinutes, attendeeCount }`.
- **Frontend component:** `MeetingsCard`.
- **Priority:** Future.
- **Notes:** Requires a Google Calendar/Outlook OAuth integration — comparable scope to the GitHub integration in §3. `kind` (standup/sprint-planning/etc.) has no natural source in a real calendar event and would need either naming-convention parsing (fragile) or manual tagging (extra UI).

### 5.2 Sprint events

- **Purpose:** Sprint start/end shown alongside meetings.
- **Priority:** Future — depends on whether TeamDesk ever gets a Sprint model at all (it doesn't today; `QuickActionsCard`'s "Create Sprint" tile is intentionally disabled/"Soon" for exactly this reason).

### 5.3 Calendar provider integration

- **Priority:** Future — prerequisite for 5.1/5.2.

---

## 6. Activity & Productivity

### 6.1 Coding streak / 6.2 Productivity metrics / 6.3 Developer insights

- Covered by §1.6 above — consolidated here for cross-reference. No additional endpoints beyond `GET /api/users/me/coding-stats`.
- **Priority:** Future.

---

## 7. AI Features

### 7.1 AI daily summary

- Covered by §1.2. **Priority:** Medium for a basic templated version (e.g. rule-based: "N issues assigned, N PRs waiting, sprint ends in N days" — no LLM needed for a first version); **Future** for genuinely generated natural language.

### 7.2 Recommendation generation

- **Purpose:** Beyond a summary — e.g. "you should review this PR first."
- **Priority:** Future — no frontend component currently expects this; don't build ahead of a concrete UI need.

### 7.3 Future RAG integration

- **Purpose:** Answering questions over an org's issues/decisions/docs.
- **Priority:** Future — directional only, no committed frontend surface yet.

---

## 8. General Requirements

### 8.1 Expected API contracts

- Follow the exact conventions already documented in `API.md`: `{ data, hasNextPage, nextCursor }` for lists, `{ error }` for failures, 404-not-403 for cross-tenant isolation. Every new endpoint above should match this, not invent a new response envelope.

### 8.2 Authentication assumptions

- All new endpoints assume the existing httpOnly session-cookie model (`credentials: "include"`, single-flight refresh-on-401 already implemented in `lib/api.ts`). No new auth mechanism needed for anything in this document.

### 8.3 Pagination

- Dashboard aggregate endpoint (§1.1) likely does **not** need cursor pagination (it's a fixed-shape "give me today's snapshot" call) — but `recentIssues`, `notifications`, and `deployments` sub-lists should each independently support the existing cursor pattern if they can grow unbounded, exactly like Issues/Decisions/Activity do today.

### 8.4 Error handling

- Every mock-backed widget already has a real `error` state wired (`WidgetCard`'s `status="error"` branch, with retry). No frontend work needed when real endpoints land — just confirm error response bodies match `{ error: string }`.

### 8.5 Loading strategies

- Every widget already fetches independently in its own `useEffect` with `AbortController`-based cancellation (see `lib/api.ts`'s `isAbortError`). This means **the dashboard does not require a single monolithic endpoint** — per-widget endpoints are equally supportable today without any frontend refactor.

### 8.6 Future extensibility

- All response shapes above are defined as TypeScript interfaces in `src/mock/dashboard.ts` — treat that file as the versioned contract. If a real field differs from the mock (name, type, nullability), that's the diff to review against this document, not a surprise.

---

## Open product decisions this document surfaces (not just API design)

These aren't backend tickets yet — they're decisions needed before backend tickets can be written correctly:

1. **§1.3** — `progress`/`estimatePoints`/`dueDate` on Issues: new fields or drop from the widget?
2. **§2.1** — Global search directly contradicts `API.md`'s explicit "no server-side search" architectural decision. Needs resolution before any search endpoint is built.
3. **§1.6** — What does "focus hours" actually measure? No data source exists for this anywhere in the current system.
4. **§2 (intro note)** — Two parallel command-palette entry points (`CommandPaletteProvider` vs. the newer `SearchBar`) exist in the frontend today. Worth reconciling in a future frontend session, separate from backend work.
