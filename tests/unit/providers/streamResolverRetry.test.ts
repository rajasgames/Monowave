import { StreamResolver } from "../../../src/providers/stream/StreamResolver";
import { StreamSource } from "../../../src/providers/stream/types";
import { Track, ResolvedStream } from "../../../src/core/types";
import { createAppError } from "../../../src/core/errors";

describe("StreamResolver resolveWithRetry & Fallback Handling", () => {
  const sampleTrack: Track = {
    id: "youtube:streamRetry1",
    provider: "youtube",
    sourceId: "streamRetry1",
    title: "Stream Retry Track",
    artist: "Artist",
  };

  it("forces cache invalidation when forceRefresh is true", async () => {
    let callCount = 0;
    const mockSource: StreamSource = {
      id: "mock-source",
      canHandle: () => true,
      resolve: async (): Promise<ResolvedStream> => {
        callCount++;
        return {
          url: `https://stream.audio/url-${callCount}.m4a`,
          expiresAt: Date.now() + 3600_000,
          resolvedBy: "mock-source",
        };
      },
    };

    const resolver = new StreamResolver([mockSource]);
    const first = await resolver.resolveWithRetry(sampleTrack, false);
    expect(first.url).toBe("https://stream.audio/url-1.m4a");
    expect(callCount).toBe(1);

    // Call without forceRefresh -> should use cache
    const cached = await resolver.resolveWithRetry(sampleTrack, false);
    expect(cached.url).toBe("https://stream.audio/url-1.m4a");
    expect(callCount).toBe(1);

    // Call with forceRefresh -> should invalidate cache and fetch fresh
    const fresh = await resolver.resolveWithRetry(sampleTrack, true);
    expect(fresh.url).toBe("https://stream.audio/url-2.m4a");
    expect(callCount).toBe(2);
  });

  it("automatically performs 1 retry when initial resolve fails", async () => {
    let callCount = 0;
    const mockSource: StreamSource = {
      id: "mock-source",
      canHandle: () => true,
      resolve: async (): Promise<ResolvedStream> => {
        callCount++;
        if (callCount === 1) {
          throw createAppError("source_unavailable", "Expired 403 response");
        }
        return {
          url: "https://stream.audio/retry-success.m4a",
          expiresAt: Date.now() + 3600_000,
          resolvedBy: "mock-source",
        };
      },
    };

    const resolver = new StreamResolver([mockSource]);
    const result = await resolver.resolveWithRetry(sampleTrack, false);

    expect(result.url).toBe("https://stream.audio/retry-success.m4a");
    expect(callCount).toBe(2);
  });

  it("propagates error when both initial and retry fail", async () => {
    let callCount = 0;
    const mockSource: StreamSource = {
      id: "mock-source",
      canHandle: () => true,
      resolve: async (): Promise<ResolvedStream> => {
        callCount++;
        throw createAppError("track_unavailable", "Video unavailable");
      },
    };

    const resolver = new StreamResolver([mockSource]);

    await expect(
      resolver.resolveWithRetry(sampleTrack, false),
    ).rejects.toMatchObject({
      kind: "track_unavailable",
      userMessage: "Video unavailable",
    });
    expect(callCount).toBe(2);
  });
});
