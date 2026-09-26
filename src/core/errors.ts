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
