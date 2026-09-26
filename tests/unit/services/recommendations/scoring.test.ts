import {
  artistKey,
  trackAffinity,
  artistAffinity,
  stableHash,
  deterministicJitter,
} from "../../../../src/services/recommendations/scoring";

describe("scoring", () => {
  describe("artistKey", () => {
    it("normalizes artist names correctly", () => {
      expect(artistKey("Artist Name - Topic")).toBe("artist name");
      expect(artistKey("Another Artist (Official)")).toBe("another artist");
      expect(artistKey("  Some   Artist  ")).toBe("some artist");
    });
  });

  describe("trackAffinity", () => {
    it("calculates basic affinity correctly", () => {
      const affinity = trackAffinity({
        plays: 1,
        completes: 1,
        liked: false,
        playlistAdds: 0,
        skips: 0,
        quickSkips: 0,
      });
      expect(affinity).toBeGreaterThan(0);
    });

    it("caps track affinity at maxTrackWeight", () => {
      const affinity = trackAffinity({
        plays: 100,
        completes: 100,
        liked: true,
        playlistAdds: 10,
        skips: 0,
        quickSkips: 0,
      });
      expect(affinity).toBeLessThanOrEqual(6.0); // maxTrackWeight is 6.0
    });

    it("subtracts for skips", () => {
      const affinity1 = trackAffinity({
        plays: 1,
        completes: 1,
        liked: false,
        playlistAdds: 0,
        skips: 0,
        quickSkips: 0,
      });
      const affinity2 = trackAffinity({
        plays: 1,
        completes: 1,
        liked: false,
        playlistAdds: 0,
        skips: 5,
        quickSkips: 0,
      });
      expect(affinity2).toBeLessThan(affinity1);
    });
  });

  describe("artistAffinity", () => {
    it("calculates basic artist affinity correctly", () => {
      const affinity = artistAffinity({
        plays: 1,
        completes: 1,
        likes: 0,
        skips: 0,
        quickSkips: 0,
        playlistAdds: 0,
      });
      expect(affinity).toBeGreaterThan(0);
    });
  });

  describe("stableHash and deterministicJitter", () => {
    it("is deterministic", () => {
      expect(stableHash("test1")).toBe(stableHash("test1"));
      expect(deterministicJitter("seed", 0.5)).toBe(
        deterministicJitter("seed", 0.5),
      );
    });
  });
});
