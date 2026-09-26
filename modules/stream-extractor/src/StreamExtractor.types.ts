export type NativeStreamSuccess = {
  ok: true;
  url: string;
  userAgent: string;
  mimeType?: string;
  bitrate?: number;
  durationSeconds?: number;
  title?: string;
  uploader?: string;
  expiresAt?: number;
  extractorVersion: string;
};

export type NativeStreamFailureReason =
  | "invalid_id"
  | "network"
  | "geo_restricted"
  | "age_restricted"
  | "paid_content"
  | "private_content"
  | "unavailable"
  | "sign_in_required"
  | "rate_limited"
  | "unsupported"
  | "live_stream"
  | "no_audio_stream"
  | "extraction_failed"
  | "unknown";

export type NativeStreamFailure = {
  ok: false;
  reason: NativeStreamFailureReason;
  message: string;
  exception?: string;
};

export type NativeStreamResult = NativeStreamSuccess | NativeStreamFailure;
