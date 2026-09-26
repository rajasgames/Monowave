import { StreamSource } from "./types";
import { Track, ResolvedStream } from "../../core/types";
import { createAppError } from "../../core/errors";
import { DirectStreamSource } from "./DirectStreamSource";
import { NativeStreamSource } from "./NativeStreamSource";

export class StreamResolver {
  private readonly sources: StreamSource[];
  private readonly cache = new Map<string, ResolvedStream>();
  private readonly inflight = new Map<string, Promise<ResolvedStream>>();

  constructor(sources?: StreamSource[]) {
    this.sources = sources ?? [
      new DirectStreamSource(),
      new NativeStreamSource(),
    ];
  }

  async resolve(track: Track, signal?: AbortSignal): Promise<ResolvedStream> {
    const now = Date.now();

    // Check in-memory cache, invalidating if within 60s of expiration
    const cached = this.cache.get(track.id);
    if (cached) {
      if (cached.expiresAt - now > 60_000) {
        return cached;
      }
      this.cache.delete(track.id);
    }

    // Deduplicate concurrent in-flight requests for the same track
    const existing = this.inflight.get(track.id);
    if (existing) {
      return existing;
    }

    const resolvePromise = this.performResolve(track, signal);
    this.inflight.set(track.id, resolvePromise);

    try {
      const resolved = await resolvePromise;
      this.cache.set(track.id, resolved);
      return resolved;
    } finally {
      this.inflight.delete(track.id);
    }
  }

  private async performResolve(
    track: Track,
    signal?: AbortSignal,
  ): Promise<ResolvedStream> {
    for (const source of this.sources) {
      if (source.canHandle(track)) {
        try {
          return await source.resolve(track, signal);
        } catch (error) {
          // If native source fails, bubble structured error
          throw error;
        }
      }
    }

    throw createAppError(
      "source_unavailable",
      `No compatible stream source found for provider: ${track.provider}`,
    );
  }

  invalidate(trackId: string): void {
    this.cache.delete(trackId);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const defaultStreamResolver = new StreamResolver();
