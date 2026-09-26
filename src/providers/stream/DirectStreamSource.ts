import { StreamSource } from "./types";
import { Track, ResolvedStream } from "../../core/types";
import { createAppError } from "../../core/errors";

export class DirectStreamSource implements StreamSource {
  readonly id = "direct-url";

  canHandle(track: Track): boolean {
    return (
      track.sourceId.startsWith("http://") ||
      track.sourceId.startsWith("https://")
    );
  }

  async resolve(track: Track, _signal?: AbortSignal): Promise<ResolvedStream> {
    if (!this.canHandle(track)) {
      throw createAppError(
        "source_unavailable",
        "Track does not contain a direct stream URL.",
      );
    }

    return {
      url: track.sourceId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      resolvedBy: this.id,
    };
  }
}
