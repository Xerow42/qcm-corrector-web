import { config } from "@/lib/config";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Builds a short, user-facing message from a failed response.
 * The raw response body is never shown, so stack traces or server details
 * cannot leak into the interface. FastAPI's `detail` field is used when present.
 */
function messageFromBody(raw: string, fallback: string): string {
  try {
    const body = JSON.parse(raw) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String((item as { msg: unknown }).msg) : ""))
        .filter(Boolean);
      if (messages.length) return messages.join(" ; ");
    }
  } catch {
    // Body is not JSON: fall through to the generic message.
  }
  return fallback;
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    const fallback = `Erreur API (${response.status})`;
    throw new ApiError(messageFromBody(raw, fallback), response.status);
  }
  return (await response.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, { cache: "no-store" });
  return parse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<T>(response);
}
