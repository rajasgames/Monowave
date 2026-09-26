import { StreamResolver } from "../../../src/providers/stream/StreamResolver";
import { StreamSource } from "../../../src/providers/stream/types";
import { Track, ResolvedStream } from "../../../src/core/types";

describe("StreamResolver", () => {
  const dummyTrack: Track = {
    id: "test:123",
    provider: "youtube",
    sourceId: "123",
    title: "Test Title",
    artist: "Test Artist",
  };

  it("resolves stream and caches in-memory for subsequent calls", async () => {
    let callCount = 0;
    const mockSource: StreamSource = {
      id: "mock-source",
      canHandle: () => true,
      resolve: async (): Promise<ResolvedStream> => {
        callCount++;
        return {
          url: "https://stream.audio/test.m4a",
          expiresAt: Date.now() + 3600_000,
          resolvedBy: "mock-source",
        };
      },
    };

    const resolver = new StreamResolver([mockSource]);
    const first = await resolver.resolve(dummyTrack);
    expect(first.url).toBe("https://stream.audio/test.m4a");
    expect(callCount).toBe(1);

    // Second call should return cached without calling source again
    const second = await resolver.resolve(dummyTrack);
    expect(second.url).toBe("https://stream.audio/test.m4a");
    expect(callCount).toBe(1);
  });

  it("deduplicates concurrent in-flight requests for the same track", async () => {
    let callCount = 0;
    const mockSource: StreamSource = {
      id: "mock-source",
      canHandle: () => true,
      resolve: async (): Promise<ResolvedStream> => {
        callCount++;
        await new Promise((r) => setTimeout(r, 50));
        return {
          url: "https://stream.audio/test.m4a",
          expiresAt: Date.now() + 3600_000,
          resolvedBy: "mock-source",
        };
      },
    };

    const resolver = new StreamResolver([mockSource]);
    const [p1, p2] = await Promise.all([
      resolver.resolve(dummyTrack),
      resolver.resolve(dummyTrack),
    ]);

    expect(p1.url).toBe(p2.url);
    expect(callCount).toBe(1);
  });

  it("invalidates expired cache entries", async () => {
    let callCount = 0;
    const mockSource: StreamSource = {
      id: "mock-source",
      canHandle: () => true,
      resolve: async (): Promise<ResolvedStream> => {
        callCount++;
        return {
          url: "https://stream.audio/test.m4a",
          // Expired timestamp
          expiresAt: Date.now() - 1000,
          resolvedBy: "mock-source",
        };
      },
    };

    const resolver = new StreamResolver([mockSource]);
    await resolver.resolve(dummyTrack);
    expect(callCount).toBe(1);

    // Since it was expired, second resolve should call source again
    await resolver.resolve(dummyTrack);
    expect(callCount).toBe(2);
  });

  it("supports explicit invalidation on playback error", async () => {
    let callCount = 0;
    const mockSource: StreamSource = {
      id: "mock-source",
      canHandle: () => true,
      resolve: async (): Promise<ResolvedStream> => {
        callCount++;
        return {
          url: "https://stream.audio/test.m4a",
          expiresAt: Date.now() + 3600_000,
          resolvedBy: "mock-source",
        };
      },
    };

    const resolver = new StreamResolver([mockSource]);
    await resolver.resolve(dummyTrack);
    expect(callCount).toBe(1);

    resolver.invalidate(dummyTrack.id);
    await resolver.resolve(dummyTrack);
    expect(callCount).toBe(2);
  });

  it("throws structured error if no source can handle the track", async () => {
    const resolver = new StreamResolver([]);
    await expect(resolver.resolve(dummyTrack)).rejects.toMatchObject({
      kind: "source_unavailable",
    });
  });
});
