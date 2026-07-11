# TeamDesk — Frontend

Next.js frontend for TeamDesk, a multi-tenant issue-tracking platform. See the [backend README](https://github.com/YOUR_USERNAME/teamdesk-backend) for full architecture and security model details — this document covers frontend-specific setup and structure.

## Tech stack

- Next.js (App Router), TypeScript
- Tailwind CSS
- Cookie-based authentication (httpOnly cookies managed entirely by the backend — the frontend never reads or stores tokens directly)

## Project structure

```
teamdesk-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       └── projects/
│   │           └── [projectId]/
│   │               └── page.tsx
│   ├── components/
│   │   └── OrgSwitcher.tsx
│   └── lib/
│       ├── api.ts
│       ├── AuthContext.tsx
│       ├── OrgContext.tsx
│       └── ProtectedRoute.tsx
├── .env.local.example
```

## Key design points

- **`src/lib/api.ts`** is the single shared API client. All authenticated requests go through it. It automatically retries once after a silent token refresh on a 401, using a single-flight guard so concurrent 401s don't trigger duplicate refresh calls (which would otherwise race against refresh token rotation on the backend).
- **`ProtectedRoute`** is the one place that reacts to a session becoming invalid (expired refresh token, logout, etc.) and redirects to `/login`. Every authenticated page should be wrapped in it.
- **`OrgContext`** tracks which organization the user is currently "acting in" in the UI. This is purely a UI convenience — it is never used for authorization. All real authorization happens server-side, derived from the authenticated user and the resource being accessed, regardless of what the frontend currently has selected.
- Role-based UI (e.g., hiding a "Create Project" button from a VIEWER) is UX polish only. The backend enforces the actual permission check independently — removing or bypassing the UI element would not grant access.

## Local development setup

1. Ensure `teamdesk-backend` is running locally at `http://localhost:4000` (see its README).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to your backend URL.
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000`.

## Environment variables

| Variable              | Description                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g., `http://localhost:4000` locally, or the deployed Render URL in production) |

## Deployment

Deployed via Vercel. `NEXT_PUBLIC_API_URL` is set in the Vercel project's environment variables to point at the deployed backend, and must match one of the origins allow-listed in the backend's CORS configuration.
