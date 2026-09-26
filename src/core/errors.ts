import { NativeStreamFailureReason } from "../../modules/stream-extractor";

export type AppErrorKind =
  | "network"
  | "timeout"
  | "rate_limited"
  | "track_unavailable"
  | "region_restricted"
  | "source_unavailable"
  | "parser_changed"
  | "storage"
  | "native_module_missing"
  | "unknown";

export type AppError = {
  kind: AppErrorKind;
  userMessage: string;
  technicalMessage?: string;
  retryable: boolean;
  cause?: unknown;
};

export function createAppError(
  kind: AppErrorKind,
  userMessage: string,
  options?: {
    technicalMessage?: string;
    retryable?: boolean;
    cause?: unknown;
  },
): AppError {
  return {
    kind,
    userMessage,
    technicalMessage: options?.technicalMessage,
    retryable: options?.retryable ?? false,
    cause: options?.cause,
  };
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    "userMessage" in error &&
    "retryable" in error
  );
}

export function mapNativeFailureToAppError(
  reason: NativeStreamFailureReason,
  message: string,
  exception?: string,
): AppError {
  switch (reason) {
    case "invalid_id":
      return createAppError(
        "track_unavailable",
        "The requested audio link is invalid.",
        {
          technicalMessage: message,
          retryable: false,
          cause: exception,
        },
      );
    case "network":
      return createAppError(
        "network",
        "Unable to connect to audio service. Check your connection.",
        {
          technicalMessage: message,
          retryable: true,
          cause: exception,
        },
      );
    case "geo_restricted":
      return createAppError(
        "region_restricted",
        "This track is restricted in your geographic region.",
        {
          technicalMessage: message,
          retryable: false,
          cause: exception,
        },
      );
    case "age_restricted":
    case "paid_content":
    case "private_content":
    case "sign_in_required":
      return createAppError(
        "track_unavailable",
        "This track requires account sign-in or authorization.",
        {
          technicalMessage: `${reason}: ${message}`,
          retryable: false,
          cause: exception,
        },
      );
    case "rate_limited":
      return createAppError(
        "rate_limited",
        "Too many requests. Please wait a moment and try again.",
        {
          technicalMessage: message,
          retryable: true,
          cause: exception,
        },
      );
    case "live_stream":
      return createAppError(
        "track_unavailable",
        "Live streams are currently not supported.",
        {
          technicalMessage: message,
          retryable: false,
          cause: exception,
        },
      );
    case "unsupported":
    case "no_audio_stream":
    case "extraction_failed":
      return createAppError(
        "source_unavailable",
        "Failed to resolve an audio stream for this track.",
        {
          technicalMessage: message,
          retryable: true,
          cause: exception,
        },
      );
    case "unknown":
    default:
      return createAppError(
        "unknown",
        "An unexpected audio playback error occurred.",
        {
          technicalMessage: message,
          retryable: true,
          cause: exception,
        },
      );
  }
}

/**
 * Checks whether an error represents a canceled or aborted request,
 * accounting for variations in fetch/network abort representations across React Native.
 */
export function isRequestCanceled(
  error: unknown,
  signal?: AbortSignal,
): boolean {
  if (signal?.aborted) return true;
  if (!error) return false;
  if (typeof error === "object") {
    const err = error as { name?: string; message?: string };
    if (
      err.name === "AbortError" ||
      err.name === "CanceledError" ||
      err.name === "CancelledError"
    ) {
      return true;
    }
    const msg = String(err.message || "").toLowerCase();
    if (
      msg.includes("abort") ||
      msg.includes("cancel") ||
      msg.includes("the user aborted a request") ||
      msg.includes("fetch request has been canceled")
    ) {
      return true;
    }
  }
  const str = String(error).toLowerCase();
  return str.includes("abort") || str.includes("cancel");
}

/**
 * Maps search failures to friendly user messages instead of exposing raw technical errors.
 */
export function mapSearchError(error: unknown): {
  message: string;
  retryable: boolean;
} {
  const msg = (
    error instanceof Error ? error.message : String(error || "")
  ).toLowerCase();

  // Timeout failure
  if (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("taking longer")
  ) {
    return {
      message: "Search is taking longer than expected. Try again.",
      retryable: true,
    };
  }

  // Network / connection / offline failure
  if (
    msg.includes("network") ||
    msg.includes("offline") ||
    msg.includes("failed to connect") ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    msg.includes("internet")
  ) {
    return {
      message: "You’re offline. Check your connection and try again.",
      retryable: true,
    };
  }

  // Provider / server failure or general fallback
  return {
    message: "YouTube Music is temporarily unavailable.",
    retryable: true,
  };
}
