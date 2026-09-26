import { createAppError, AppError } from "./errors";

export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly bodyText?: string;

  constructor(status: number, statusText: string, bodyText?: string) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
    this.bodyText = bodyText;
  }
}

export type HttpRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  retries?: number;
};

export async function requestJson<T>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    timeoutMs = 15000,
    signal: userSignal,
    retries = 1,
  } = options;

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const onUserAbort = () => controller.abort();
    if (userSignal) {
      if (userSignal.aborted) {
        clearTimeout(timeoutId);
        throw createAppError("timeout", "The request was aborted.");
      }
      userSignal.addEventListener("abort", onUserAbort, { once: true });
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let bodyText: string | undefined;
        try {
          bodyText = await response.text();
        } catch {
          /* Ignore body read failure on error response */
        }
        throw new HttpError(response.status, response.statusText, bodyText);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      lastError = err;
      if (userSignal?.aborted) {
        throw createAppError("timeout", "The network request was aborted.", {
          cause: err,
        });
      }

      // Do not retry 4xx errors
      if (err instanceof HttpError && err.status >= 400 && err.status < 500) {
        throw createAppError(
          err.status === 429 ? "rate_limited" : "network",
          `Server returned HTTP ${err.status}`,
          {
            technicalMessage: err.bodyText,
            retryable: err.status === 429,
            cause: err,
          },
        );
      }

      attempt++;
      if (attempt > retries) {
        break;
      }
      // Brief backoff before retry
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    } finally {
      clearTimeout(timeoutId);
      if (userSignal) {
        userSignal.removeEventListener("abort", onUserAbort);
      }
    }
  }

  if (lastError instanceof HttpError) {
    throw createAppError("network", `HTTP error: ${lastError.status}`, {
      technicalMessage: lastError.bodyText,
      retryable: true,
      cause: lastError,
    });
  }

  throw createAppError(
    "network",
    "Network request failed. Please check your internet connection.",
    {
      technicalMessage:
        lastError instanceof Error ? lastError.message : String(lastError),
      retryable: true,
      cause: lastError,
    },
  );
}
