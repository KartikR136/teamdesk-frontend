# Roadmap

This project's guiding filter for any future work: **does this add depth to the multi-tenancy/authorization story, or just breadth to the feature list?** Only the former has ever been in scope. Everything below is organized by why it's deferred, not just that it's missing.

## Deferred pending a backend capability that doesn't exist yet

These aren't oversights — they were each evaluated against the actual data available and correctly not built rather than faked:

- **"Assigned to me" dashboard widget.** No endpoint filters issues by assignee across projects; building it via client-side filtering after fetching every project's issues would be an N+1 anti-pattern and would defeat the cursor-pagination investment. Correct fix: an additive `?assigneeId=me` query param on the existing issues endpoint.
- **Overdue work / due dates.** `Issue` has no due-date field in the schema. Would require a schema migration, not a frontend change.
- **Workload / "who is overloaded."** Depends on the assignee-filtering capability above.
- **Per-project issue counts, member counts, or progress indicators** on the Projects list. The `Project` model has no aggregate fields; would require either a new aggregating endpoint or N+1 fetching (rejected).
- **Per-issue activity history.** The activity feed is org-scoped, not filterable by issue. Would need a new query capability.
- **Global/full-text search across projects and issues.** Cursor pagination has no search endpoint; current search/sort in the UI is explicitly scoped to "already-loaded pages" and labeled as such rather than implying a full search.
- **Activity filtering by action type** (Comments / Projects / Issues / Members). The activity endpoint has no query params beyond pagination. UI architecture for this is reserved (a filter-chip row exists with only "All" wired) so adding real filters later doesn't require a redesign.

## Deferred as a named "next step for production," not a blocker

- **CSRF double-submit token.** Cookie-based auth with cross-domain `sameSite: "none"` genuinely removes `sameSite`'s CSRF protection. Correctly scoped as understood and named, not silently ignored — see `ARCHITECTURE.md`.
- **Separate rate-limiter buckets** for `/login`, `/signup`, `/refresh` (currently one shared IP-keyed counter). Functional, but a real abuse-vector risk with a small, well-understood fix.
- **`(organizationId, createdAt)` composite index.** Fine at current data volume; would matter at scale.

## Deferred by explicit product-scoping decision (not gaps)

These were considered and rejected early in the project, not skipped due to time:

- Labels, favorites, saved filters
- Notifications (in-app or email)
- Kanban / drag-and-drop board view
- Command palette (the search input's `⌘K` placeholder is reserved architecture for this, not a promise it's coming soon)
- Dark mode (the design token architecture — CSS variables via `@theme` — is dark-mode-ready; a second value block is all a future pass would need)
- Analytics dashboards, charts, burndown/velocity metrics — explicitly rejected as decoration that doesn't serve this project's actual thesis

## Smaller, real, and genuinely worth doing next

- **Keyboard shortcuts** on the issue detail page (`E` to edit, `.` to focus the comment box) — named as a nice-to-have since Milestone 7, never blocking.
- **Consolidate `IssueMetadata.tsx`'s local `formatDate`** into a shared date-formatting module alongside `lib/activity/formatter.ts`'s `formatAbsoluteTime` — not a true duplicate (date-only vs. date+time) but adjacent enough to be worth unifying.
- **Consistent `cancelled`-flag guards** against post-unmount `setState` across all data-fetching effects — currently applied in `ActivityFeed` and the dashboard's stats effect, not yet in `ProjectsSection`, `WorkspaceOverview`, or several page-level effects. Low severity (produces a console warning, not a user-visible bug) but worth making consistent.
- **Confirm `MANAGER`'s actual distinct backend permission** (beyond its position in the role hierarchy) by reviewing `src/routes/members.ts` directly — currently worded honestly as unconfirmed in `roles.ts` rather than guessed.
- **Manual accessibility pass**: keyboard-only walkthrough, screen-reader labels beyond icon-only buttons (already covered), and a reduced-motion visual confirmation across Dialog/Sheet/Dropdown/Toast.

## Explicitly not a roadmap item

Migrating off cursor pagination to support arbitrary page-jumping, or introducing a service/repository layer between routes and Prisma — both were evaluated and rejected as adding complexity without a concrete problem they'd solve at this project's scale. If either is ever proposed again, it should come with a stated, specific problem it fixes, per this project's standing rule that no architectural change happens without a named trade-off.
