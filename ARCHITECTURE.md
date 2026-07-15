# Architecture

## System overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Next.js (App    │  HTTPS  │  Express API      │         │  PostgreSQL │
│  Router) frontend │ ──────► │  (Node/TypeScript)│ ──────► │  (Neon)     │
│  Vercel           │         │  Render           │         │             │
└─────────────────┘         └────────┬──────────┘         └─────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Redis (Upstash)│
                              │  membership-role │
                              │  cache            │
                              └─────────────────┘
```

Authentication is httpOnly-cookie based (not bearer tokens) with refresh-token rotation. Every API request that needs org context resolves it server-side from the URL/resource, never trusts a client-supplied organization ID without verifying the authenticated user actually belongs to it.

## The core invariant

**No organization can ever access another organization's data.** This is the single hardest requirement the whole backend serves, and it shows up in three separate, reinforcing design decisions:

1. **`organizationId` is denormalized onto every resource** (`Issue`, `Project`, `Comment` via its issue, `ActivityLog`) rather than derived transitively through joins at query time. Every list/read query filters by `organizationId` directly — there's no path where a query can accidentally return cross-org data because a join was written wrong.
2. **JWTs carry only identity, never roles.** Roles are loaded fresh from the database on every request via `requireRole` middleware (with a short-lived Redis cache, see below) — a stale or forged token can never grant a permission the user doesn't currently have.
3. **Org context is always derived server-side** from the resource being accessed (`resolveOrgFromParam`, `resolveOrgFromIssue`, `resolveOrgFromComment`, `resolveOrgFromProject`), never trusted from a client-supplied field. A request to mutate issue X always re-derives "which org does X belong to" from the database, then checks the authenticated user's membership in _that_ org — closing the class of bug where a client could pass a different organizationId in the request body to escalate access.

This is tested directly, not just assumed: cross-org cursor replay (a pagination cursor minted from Org A's list can't leak Org B's rows even though the underlying cursor lookup is technically global), cross-org comment ownership, and wrong-recipient invitation acceptance are all covered by the backend test suite.

## Folder structure

### Backend

```
teamdesk-backend/
├── prisma/schema.prisma
├── src/
│   ├── lib/              # prisma client, redis client, pagination helpers,
│   │                      activityLog, resolveOrgContext, tokens, password
│   ├── middleware/        # requireAuth, requireRole (+ cache invalidation),
│   │                      rateLimiters, errorHandler
│   ├── routes/            # one file per resource
│   └── test/              # one file per feature area
```

### Frontend

```
teamdesk-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   └── dashboard/
│   │       ├── page.tsx                          # dashboard home
│   │       ├── members/page.tsx
│   │       ├── invitations/page.tsx
│   │       ├── activity/page.tsx
│   │       └── projects/[projectId]/
│   │           ├── page.tsx                       # issue list
│   │           └── issues/[issueId]/page.tsx       # issue detail
│   ├── components/
│   │   ├── ui/              # design-system primitives (Button, Card, Dialog,
│   │   │                     Dropdown, Toast, Badge, Avatar, Skeleton, Sheet...)
│   │   ├── layout/           # DashboardShell, Sidebar, Header, MobileSidebar,
│   │   │                     navigation.ts (data-driven nav config)
│   │   ├── dashboard/         # dashboard-specific composition components
│   │   ├── issue/             # IssueHeader, IssueMetadata, IssueDescription,
│   │   │                       IssueStatus, IssueComments — all pure-props
│   │   ├── members/            # MemberCard, RoleSelector, InviteCard, RoleInfo
│   │   └── activity/           # ActivityList, ActivityGroup, ActivityItem —
│   │                            shared by the dashboard preview and full page
│   ├── providers/               # AuthProvider, OrgProvider
│   ├── shared/components/        # ProtectedRoute
│   ├── lib/
│   │   ├── api.ts                 # typed fetch wrapper, single-flight refresh
│   │   ├── notifications.ts        # useNotify() — single call site for toasts
│   │   ├── permissions.ts           # UX-only permission helpers (backend is
│   │   │                             always the real source of truth)
│   │   ├── roles.ts                  # ROLE_METADATA — single source for
│   │   │                              label/description/badge styling per role
│   │   └── activity/                  # formatter.ts, grouping.ts, config.ts
│   ├── styles/theme.css                # design tokens (CSS variables)
│   └── types/index.ts                   # shared domain types
```

## Design decisions and trade-offs

### Pagination

Cursor-based (`{createdAt, id}` compound cursor, base64-encoded, opaque to the client), not offset. Chosen because OFFSET's cost grows linearly with page depth — a stated trade-off from the project's first milestone, not a framework default. The consequence, accepted deliberately: there's no "jump to page 5," only "load more." Search and sort on the frontend (Projects list) operate only on already-loaded pages as a result — labeled honestly in the UI rather than implying a full search.

### No service/repository layer

Routes call Prisma directly. Considered and explicitly rejected at the point it would have been tempting to add one (to "support activity logging properly"), on the reasoning that it would add a layer of indirection without a concrete, current problem it solves.

### Activity logging as an explicit call, not a database trigger

`logActivity()` is called explicitly at the end of each mutation's route handler. "Tamper-proof" means "a client can't skip or forge it by calling the API directly," not "it fires automatically without a code path." It swallows its own errors (never rethrows) — an audit-trail write failing should never roll back or 500 the mutation it's describing; this means a logging failure is invisible to the end user, an accepted trade-off.

### Redis membership-role caching

One cache key format (`membership:${userId}:${organizationId}`), one place that knows it (`requireRole.ts`), invalidated at exactly the three mutation points that cause staleness: role change, member removal, invitation acceptance. Role-change staleness ("wrong permission level for up to 60s") and removal staleness ("access that should be revoked, isn't yet") are treated as different severities in the code comments, not identically.

### Frontend: no service/data-fetching layer (e.g. React Query)

Each page/component fetches its own data via a shared typed `apiFetch<T>()`. This means the dashboard currently makes duplicate first-page fetches (stats effect + `ActivityFeed` + `WorkspaceOverview` each independently fetch overlapping data) — a named, accepted trade-off for keeping components independently simple, not an oversight. Worth revisiting if a shared cache layer is ever justified by a real performance problem.

### Design system: hybrid shadcn/ui approach

Simple primitives (Button, Input, Card, Badge, Skeleton) are hand-written directly against the design tokens. Primitives with real accessibility complexity (Dialog, Dropdown, Toast, Sheet, Avatar) are built on Radix UI. Reasoning: writing the simple ones directly avoids stripping out a generated template's default styling; using Radix for the complex ones avoids re-implementing focus-trapping, ARIA wiring, and portal rendering that Radix already gets right.

### `RoleBadge` is not a `Badge` variant

The generic `Badge` primitive has three rank-relevant visual tiers (`neutral`/`subtle`/`solid`); the product's role hierarchy has four (`VIEWER`/`MEMBER`/`MANAGER`/`ADMIN`). Mapping the role hierarchy onto `Badge`'s variant set would collapse two ranks into the same visual weight, losing the signature "badge weight scales with permission rank" pattern established as the product's one deliberately bold visual element. Kept as its own small component instead, using only semantic tokens.

## Deferred UI enhancements

Discovered while building the M3 product-identity pass — named here rather than silently worked around:

- **Role badges on activity feed actors, issue assignees, and issue creators.** `RoleBadge` currently appears everywhere the frontend actually has role data: the Members list and pending Invitations. It does _not_ appear on activity-feed entries or issue assignee/creator, because those routes only ever select `{ id, name }` for the nested user — there is no role field to render. Faking one (e.g. reusing the viewer's own role) would display incorrect, unverified authorization information next to someone else's name. Extending coverage there requires an additive backend change (adding `role` to the relevant `select`/`include` blocks in `activity.ts` and `issues.ts`), which is out of scope for a frontend-only milestone. Named as a real next step, not implemented speculatively.
- **`RoleBadge`'s raw Tailwind colors.** `RoleBadge` intentionally keeps its own `zinc-`/`indigo-` values rather than routing through `components/ui/`'s semantic-token rule — its four-level weight hierarchy is the product's signature visual element, and `Badge`'s three generic tiers can't represent four ranks without collapsing two of them into the same visual weight (the exact loss the original design decision was made to avoid). Migrating `RoleBadge` to semantic CSS variables is deferred to the dark-mode milestone (M10), when `theme.css` gets touched anyway — at that point it can gain a proper `--role-viewer` / `--role-member` / `--role-manager` / `--role-admin` token set without touching its visual hierarchy.

## Known trade-offs

- **CSRF**: cookie-based auth with cross-domain `sameSite: "none"` genuinely removes `sameSite`'s CSRF protection. The standard production fix (double-submit token) is a named "next step," not a blocker — the interview value is in articulating the trade-off correctly, not pre-building a mitigation nobody asked to see yet.
- **Shared rate-limiter bucket** across `/login`, `/signup`, `/refresh` (one IP-keyed counter, not three) — functional, a real abuse-vector risk, small fix (separate limiter instances or key by IP+route).
- **No `(organizationId, createdAt)` composite index** — fine at current scale, named as a scaling limitation.
- **`MANAGER`'s exact distinct permission** beyond rank position in the hierarchy is not confirmed against a specific backend rule — worded honestly in `roles.ts` rather than invented.
