import { StreamSource } from "./types";
import { Track, ResolvedStream } from "../../core/types";
import { resolveAudio } from "../../../modules/stream-extractor";
import { mapNativeFailureToAppError } from "../../core/errors";

export class NativeStreamSource implements StreamSource {
  readonly id = "native-newpipe";

  canHandle(track: Track): boolean {
    return (
      track.provider === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(track.sourceId)
    );
  }

  async resolve(track: Track, _signal?: AbortSignal): Promise<ResolvedStream> {
    const result = await resolveAudio(track.sourceId);

    if (!result.ok) {
      throw mapNativeFailureToAppError(
        result.reason,
        result.message,
        result.exception,
      );
    }

    let expiresAt: number;
    try {
      const parsedUrl = new URL(result.url);
      const expireParam = parsedUrl.searchParams.get("expire");
      if (expireParam && /^\d+$/.test(expireParam)) {
        expiresAt = Number(expireParam) * 1000;
      } else {
        // Fallback: 5 hours from now
        expiresAt = Date.now() + 5 * 60 * 60 * 1000;
      }
    } catch {
      expiresAt = Date.now() + 5 * 60 * 60 * 1000;
    }

    return {
      url: result.url,
      userAgent: result.userAgent,
      mimeType: result.mimeType,
      bitrate: result.bitrate,
      expiresAt,
      resolvedBy: this.id,
    };
  }
}
