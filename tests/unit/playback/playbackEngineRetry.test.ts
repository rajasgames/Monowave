import { PlaybackEngine } from "../../../src/playback/PlaybackEngine";
import { StreamResolver } from "../../../src/providers/stream/StreamResolver";
import { Track } from "../../../src/core/types";
import { createAppError } from "../../../src/core/errors";

describe("PlaybackEngine Retry & Seek Behavior", () => {
  const sampleTrack: Track = {
    id: "youtube:retryTrack123",
    provider: "youtube",
    sourceId: "retryTrack123",
    title: "Retry Song",
    artist: "Resilience Band",
    durationSeconds: 120,
  };

  it("automatically invalidates cache and retries once on initial resolution failure", async () => {
    let callCount = 0;
    const mockResolver = {
      resolve: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(
            createAppError("source_unavailable", "Stream token expired (403)", {
              retryable: true,
            }),
          );
        }
        return Promise.resolve({
          url: "https://stream.audio/fresh-stream.m4a",
          userAgent: "TestAgent",
          expiresAt: Date.now() + 3600_000,
          resolvedBy: "mock",
        });
      }),
      invalidate: jest.fn(),
    } as unknown as StreamResolver;

    const engine = new PlaybackEngine(mockResolver);
    await engine.play(sampleTrack);

    expect(callCount).toBe(2);
    expect(mockResolver.invalidate).toHaveBeenCalledWith(sampleTrack.id);
    expect(engine.getSnapshot().status).toBe("playing");
    expect(engine.getSnapshot().currentTrack?.id).toBe(sampleTrack.id);
  });

  it("halts after 1 retry attempt to prevent infinite retry loops", async () => {
    let callCount = 0;
    const mockResolver = {
      resolve: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(createAppError("network", "Connection refused"));
      }),
      invalidate: jest.fn(),
    } as unknown as StreamResolver;

    const engine = new PlaybackEngine(mockResolver);

    await expect(engine.play(sampleTrack)).rejects.toMatchObject({
      kind: "network",
    });
    // Exactly 2 attempts: initial + 1 retry
    expect(callCount).toBe(2);
    expect(engine.getSnapshot().status).toBe("error");
    expect(engine.getSnapshot().error?.kind).toBe("network");
  });

  it("accurately seeks forward and backward with seekBy delta", async () => {
    const mockResolver = {
      resolve: jest.fn().mockResolvedValue({
        url: "https://stream.audio/stream.m4a",
        expiresAt: Date.now() + 3600_000,
        resolvedBy: "mock",
      }),
      invalidate: jest.fn(),
    } as unknown as StreamResolver;

    const engine = new PlaybackEngine(mockResolver);
    await engine.play(sampleTrack);

    // Initial position is 0
    await engine.seek(30);
    expect(engine.getSnapshot().positionSeconds).toBe(30);

    // Seek forward by 15s
    await engine.seekBy(15);
    expect(engine.getSnapshot().positionSeconds).toBe(45);

    // Seek backward by 20s
    await engine.seekBy(-20);
    expect(engine.getSnapshot().positionSeconds).toBe(25);

    // Seek backward past 0: clamped to 0
    await engine.seekBy(-50);
    expect(engine.getSnapshot().positionSeconds).toBe(0);

    // Seek forward past duration (120s): clamped to 120
    await engine.seekBy(200);
    expect(engine.getSnapshot().positionSeconds).toBe(120);
  });
});
