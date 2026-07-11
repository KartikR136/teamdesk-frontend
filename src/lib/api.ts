const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Single-flight guard: ensures concurrent 401s trigger only ONE refresh call,
// not one per failed request (see race condition explanation above).
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Fired when refresh itself fails — session is genuinely dead.
// Set by the app shell (see AuthProvider below) so this file doesn't
// need to know about React Router/Next navigation directly.
let onSessionExpired: (() => void) | null = null;
export function registerSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const doFetch = () =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });

  let res = await doFetch();

  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    const refreshed = await attemptRefresh();

    if (!refreshed) {
      onSessionExpired?.();
      throw new ApiError(401, "Session expired");
    }

    res = await doFetch(); // retry original request exactly once
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || "Request failed");
  }

  // 204 No Content (e.g. DELETE /api/comments/:id) has no body — calling
  // res.json() on an empty body throws a SyntaxError, which would otherwise
  // get misread by callers as a failed request even though res.ok is true.
  // Content-Length can be absent on some responses even with a body, so
  // status code is the more reliable check here.
  if (res.status === 204) {
    return null;
  }

  return res.json();
}
