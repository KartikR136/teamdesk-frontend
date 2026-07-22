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
// Set by the app shell (see AuthProvider) so this file doesn't need to
// know about React Router/Next navigation directly.
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

/**
 * True when `err` is a fetch abort — i.e. the caller cancelled the
 * request on purpose (component unmounted, a newer request superseded
 * it, etc.), not a real failure. Callers should check this before
 * showing an error toast: an aborted request is not an error the user
 * needs to see.
 */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const doFetch = () =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });

  // Signal already aborted before we even started — most likely a
  // component that fired a request then immediately unmounted (fast
  // navigation between issues/decisions). Fail fast without a network
  // call rather than doing work nobody will use.
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  let res = await doFetch();

  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    // If the caller cancelled while we were in flight, don't spend a
    // refresh + retry cycle on a request nobody's waiting for anymore —
    // this is the actual race-condition fix: previously a stale request
    // (e.g. from an issue page the user already navigated away from)
    // could still trigger attemptRefresh() and a second fetch, whose
    // eventual response could arrive after and overwrite state set by a
    // newer, still-relevant request.
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const refreshed = await attemptRefresh();

    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

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
    return null as T;
  }

  return res.json() as Promise<T>;
}
