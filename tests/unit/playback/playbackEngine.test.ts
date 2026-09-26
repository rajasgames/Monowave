import { PlaybackEngine } from "../../../src/playback/PlaybackEngine";
import { StreamResolver } from "../../../src/providers/stream/StreamResolver";
import { Track } from "../../../src/core/types";

describe("PlaybackEngine", () => {
  const trackA: Track = {
    id: "youtube:trackA",
    provider: "youtube",
    sourceId: "trackA",
    title: "Track A",
    artist: "Artist A",
    durationSeconds: 200,
  };

  const trackB: Track = {
    id: "youtube:trackB",
    provider: "youtube",
    sourceId: "trackB",
    title: "Track B",
    artist: "Artist B",
    durationSeconds: 180,
  };

  it("plays track cleanly and notifies state changes", async () => {
    const mockResolver = {
      resolve: jest.fn().mockResolvedValue({
        url: "https://stream.audio/trackA.m4a",
        userAgent: "TestAgent",
        expiresAt: Date.now() + 3600_000,
        resolvedBy: "mock",
      }),
    } as unknown as StreamResolver;

    const engine = new PlaybackEngine(mockResolver);
    const snapshots: string[] = [];
    engine.onStateChange((s) => snapshots.push(s.status));

    await engine.play(trackA);

    expect(mockResolver.resolve).toHaveBeenCalledWith(
      trackA,
      expect.any(Object),
    );
    expect(engine.getSnapshot().status).toBe("playing");
    expect(engine.getSnapshot().currentTrack?.id).toBe("youtube:trackA");
    expect(snapshots).toContain("loading");
    expect(snapshots).toContain("playing");
  });

  it("prevents rapid-tap overlaps by discarding stale resolution", async () => {
    let resolveFirstTrack: (val: any) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirstTrack = resolve;
    });

    const mockResolver = {
      resolve: jest.fn().mockImplementation((track: Track) => {
        if (track.id === "youtube:trackA") {
          return firstPromise;
        }
        return Promise.resolve({
          url: "https://stream.audio/trackB.m4a",
          expiresAt: Date.now() + 3600_000,
          resolvedBy: "mock",
        });
      }),
    } as unknown as StreamResolver;

    const engine = new PlaybackEngine(mockResolver);

    // Tap track A
    const playAPromise = engine.play(trackA);

    // Immediately tap track B while track A is in flight
    await engine.play(trackB);
    expect(engine.getSnapshot().currentTrack?.id).toBe("youtube:trackB");

    // Now resolve track A
    resolveFirstTrack!({
      url: "https://stream.audio/trackA.m4a",
      expiresAt: Date.now() + 3600_000,
      resolvedBy: "mock",
    });
    await playAPromise;

    // Track B must still remain the active playing track
    expect(engine.getSnapshot().currentTrack?.id).toBe("youtube:trackB");
  });

  it("records skip event when advancing away from an unfinished track", async () => {
    const mockResolver = {
      resolve: jest.fn().mockResolvedValue({
        url: "https://stream.audio/track.m4a",
        expiresAt: Date.now() + 3600_000,
        resolvedBy: "mock",
      }),
    } as unknown as StreamResolver;

    const engine = new PlaybackEngine(mockResolver);
    const skips: Array<{ track: Track; fraction: number }> = [];
    engine.onTrackSkip((track, fraction) => skips.push({ track, fraction }));

    await engine.play(trackA);
    // User switches to track B before track A finished
    await engine.play(trackB);

    expect(skips.length).toBe(1);
    expect(skips[0].track.id).toBe("youtube:trackA");
  });
});
