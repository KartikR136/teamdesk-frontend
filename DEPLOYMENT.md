# Deployment

## Local development setup

### Prerequisites
- Node.js (version matching `package.json` engines, if specified)
- A PostgreSQL database (Neon recommended, matches production)
- A Redis instance (Upstash recommended, matches production)

### Backend

```bash
cd teamdesk-backend
npm install
```

Create `.env`:
```
DATABASE_URL=postgresql://...
TEST_DATABASE_URL=postgresql://...     # separate database — see note below
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
NODE_ENV=development
```

```bash
npx prisma migrate deploy
npm run dev
```

**Important**: `TEST_DATABASE_URL` must point to a genuinely separate database from `DATABASE_URL`. `npx prisma migrate dev` only applies to whichever URL is currently active based on `NODE_ENV` — a migration applied to dev does **not** automatically apply to the test database. When adding a new migration, run `migrate deploy` against both URLs explicitly.

### Frontend

```bash
cd teamdesk-frontend
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
npm run dev
```

---

## Production deployment

### Backend (Render)
- Set all environment variables from the local `.env` list above in Render's dashboard
- Build command: `npm install && npx prisma generate`
- Start command: `npm start` (or your configured start script)
- **Run `npx prisma migrate deploy` against the production database** before or during first deploy — this does not happen automatically on every deploy unless explicitly wired into your build step

### Frontend (Vercel)
- Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
- Standard Next.js build — no special configuration needed

### Cross-domain cookie requirements
Since frontend and backend are deployed to different domains (Vercel + Render), cookies must be set with:
- `sameSite: "none"`
- `secure: true`
- Correct `domain` scoping if using subdomains

This is a deliberate, understood trade-off — see the CSRF note in [`ARCHITECTURE.md`](./ARCHITECTURE.md#known-trade-offs).

---

## Troubleshooting

### "Insufficient permissions" or generic "Request failed" errors on a page that should work

Two known causes encountered during this project, in order of likelihood:

1. **The backend route doesn't exist on the server you're actually running.** If you're testing a frontend feature that depends on a recently-added backend endpoint (e.g. `GET /api/issues/:issueId`, added in this project's Milestone 7 specifically for the issue detail page), confirm:
   - The route is actually present in your running backend's `src/routes/` files
   - Your backend dev server has been restarted since that route was added
   - Check the browser Network tab for the actual HTTP status code — a generic "Request failed" with no specific error message usually means Express's *default* 404/500 handler responded (HTML, not JSON), which happens when the route genuinely isn't registered.

2. **A stale role/session after being demoted or removed from an org in another tab.** The Redis membership cache has up to ~60 seconds of staleness by design (see `ARCHITECTURE.md`) — if you changed your own role in one browser tab, a second tab may briefly act on outdated permissions. This resolves itself; if it doesn't, check that cache invalidation is actually firing (`invalidateMembershipCache` in `requireRole.ts`).

### Neon database "Can't reach database server" during tests
Neon's free-tier compute auto-suspends after inactivity. Usually resolves on retry once compute wakes back up — not a code bug.

### Frontend build fails with "Cannot find module" for a recently-added package
Confirm `package.json` actually has the dependency listed (not just imported in code), then run a clean reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### ESLint error: "Calling setState synchronously within an effect"
This project's established convention: wrap the effect body in an async IIFE so `setState` calls happen inside the async function, not synchronously in the effect body itself:
```tsx
useEffect(() => {
  void (async () => {
    setLoading(true);
    // ... await work ...
    setLoading(false);
  })();
}, [dependency]);
```

---

## Environment variable reference

| Variable | Where | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | Backend | Yes | Primary Postgres connection string |
| `TEST_DATABASE_URL` | Backend | Yes (for tests) | Separate Postgres database for the test suite |
| `REDIS_URL` | Backend | Yes | Membership-role cache |
| `JWT_ACCESS_SECRET` | Backend | Yes | Access token signing secret |
| `JWT_REFRESH_SECRET` | Backend | Yes | Refresh token signing secret |
| `NEXT_PUBLIC_API_URL` | Frontend | Yes | Backend base URL, exposed to the browser |
