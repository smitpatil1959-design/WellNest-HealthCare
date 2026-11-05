/**
 * Safely fetch a JSON API endpoint.
 *
 * Prevents the "Unexpected token 'i', 'import sup...' is not valid JSON" crash
 * that occurs when Vite returns an HTML 404 or a JS module instead of JSON
 * (e.g., for API routes that don't exist yet).
 *
 * Returns { ok: true, data } or { ok: false, error, status }.
 */
export async function safeApiFetch<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (networkErr: unknown) {
    return { ok: false, error: networkErr instanceof Error ? networkErr.message : 'Network error', status: 0 };
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    // Vite / Express returned HTML or JS � not a JSON API response.
    return {
      ok: false,
      error: res.ok
        ? 'Server returned a non-JSON response'
        : `HTTP ${res.status}: ${res.statusText}`,
      status: res.status,
    };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: 'Failed to parse JSON response', status: res.status };
  }

  if (!res.ok) {
    const errorBody = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const errMsg = typeof errorBody.error === 'string'
      ? errorBody.error
      : typeof errorBody.message === 'string'
        ? errorBody.message
        : `HTTP ${res.status}`;
    return { ok: false, error: errMsg, status: res.status };
  }

  return { ok: true, data: body as T };
}

