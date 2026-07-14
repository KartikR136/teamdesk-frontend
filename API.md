# API Reference

Base URL: `{NEXT_PUBLIC_API_URL}` (e.g. `http://localhost:4000` locally)

All endpoints require authentication via httpOnly session cookie unless noted. All list endpoints are cursor-paginated (see [Pagination](#pagination) below).

> **Confidence note**: endpoints marked ✅ were directly confirmed against real route files during this project's frontend work. Endpoints marked with the handoff-document icon (📄) are described based on the original project handoff documentation, not independently re-verified route-by-route — treat their exact request/response shape as likely-correct but not guaranteed.

---

## Authentication 📄

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account, sets session cookie |
| POST | `/api/auth/login` | Authenticate, sets session cookie |
| POST | `/api/auth/logout` | Clear session |
| POST | `/api/auth/refresh` | Rotate refresh token |
| GET | `/api/auth/me` | Current authenticated user |

## Organizations 📄

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/organizations` | any member | List orgs the current user belongs to |
| POST | `/api/organizations` | authenticated | Create a new organization (creator becomes ADMIN) |

## Projects ✅

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/organizations/:organizationId/projects` | VIEWER+ | Paginated project list |
| POST | `/api/organizations/:organizationId/projects` | MEMBER+ | Create project |

**Project shape**: `{ id, name, description, createdAt, organizationId }`

## Issues ✅

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/organizations/:organizationId/issues` | VIEWER+ | Org-wide paginated issue list |
| GET | `/api/organizations/:organizationId/projects/:projectId/issues` | VIEWER+ | Project-scoped paginated issue list |
| GET | `/api/issues/:issueId` | VIEWER+ | Single issue **with comments included** — added in this project's Milestone 7 specifically to support a dedicated issue detail page (see [`ARCHITECTURE.md`](./ARCHITECTURE.md)) |
| POST | `/api/organizations/:organizationId/issues` | MEMBER+ | Create issue |
| PATCH | `/api/issues/:issueId` | MEMBER+ | Update issue (title/description/status/assigneeId — any subset) |

**Issue shape** (from `GET /api/issues/:issueId`): `{ id, title, description, status, priority, projectId, creator: {id, name}, assignee: {id, name} | null, createdAt, updatedAt, comments: Comment[] }`

`status`: `"TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"`
`priority`: `"LOW" | "MEDIUM" | "HIGH" | "URGENT"`

## Comments 📄

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/issues/:issueId/comments` | VIEWER+ | Paginated comments for an issue |
| POST | `/api/issues/:issueId/comments` | MEMBER+ | Add comment |
| PATCH | `/api/comments/:commentId` | author or ADMIN | Edit comment |
| DELETE | `/api/comments/:commentId` | author or ADMIN | Delete comment (204 No Content) |

## Activity ✅

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/organizations/:organizationId/activity` | VIEWER+ | Paginated activity feed |

**ActivityLog shape** (confirmed fields only): `{ id, action, createdAt, user: {id, name} }` — additional fields may exist on the model beyond what's confirmed here; see the honesty note in `types/index.ts`'s `ActivityEntry` type.

`action` enum: `ORGANIZATION_CREATED | PROJECT_CREATED | ISSUE_CREATED | ISSUE_UPDATED | COMMENT_CREATED | COMMENT_EDITED | COMMENT_DELETED | MEMBER_INVITED | MEMBER_JOINED | MEMBER_ROLE_CHANGED | MEMBER_REMOVED`

## Members 📄

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/organizations/:organizationId/members` | VIEWER+ | Paginated member list |
| PATCH | `/api/organizations/:organizationId/members/:userId` | ADMIN | Change a member's role (blocked if target is the sole remaining admin) |
| DELETE | `/api/organizations/:organizationId/members/:userId` | ADMIN | Remove a member (same last-admin lockout) |

## Invitations 📄

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/organizations/:organizationId/invitations` | ADMIN | Pending invitations for the org |
| POST | `/api/organizations/:organizationId/invitations` | ADMIN | Invite by email + role |
| GET | `/api/invitations/me` | authenticated | Invitations addressed to the current user's email |
| POST | `/api/invitations/:invitationId/accept` | authenticated (matching email) | Accept, joins the org |
| POST | `/api/invitations/:invitationId/reject` | authenticated (matching email) | Decline |

---

## Pagination

Every list endpoint accepts:

| Query param | Type | Description |
|---|---|---|
| `cursor` | string (opaque, base64) | From a previous response's `nextCursor` |
| `limit` | number | Page size |

Response shape:
```json
{
  "data": [ /* array of resources */ ],
  "hasNextPage": true,
  "nextCursor": "opaque-string-or-null"
}
```

There is no offset/page-number pagination and no server-side search across paginated lists — chosen deliberately (see `ARCHITECTURE.md`). Cursors are opaque; do not construct or parse them on the client.

## Error responses

Standard shape: `{ "error": "message" | { /* zod flatten() validation errors */ } }`

| Status | Meaning |
|---|---|
| 400 | Validation failure or invalid cursor |
| 401 | Not authenticated / session expired |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found, or not found *for this org* (multi-tenant isolation returns 404, not 403, to avoid confirming a resource exists in another org) |
| 204 | Success, no body (DELETE endpoints) |
