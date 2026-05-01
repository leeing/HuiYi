export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`API error ${status}: ${detail}`);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export async function apiClient<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const callerHeaders: Record<string, string> =
    init.headers instanceof Headers
      ? Object.fromEntries(init.headers.entries())
      : Array.isArray(init.headers)
        ? Object.fromEntries(init.headers)
        : (init.headers ?? {});

  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...callerHeaders,
    },
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // ignore parse errors — use status code as fallback
    }
    throw new ApiError(response.status, detail);
  }

  // NOTE: response.json() returns unknown at runtime; caller is trusted to provide correct T
  return response.json() as Promise<T>;
}
