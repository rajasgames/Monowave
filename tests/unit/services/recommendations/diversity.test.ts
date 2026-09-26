import {
  interleavePools,
  applyDiversity,
} from "../../../../src/services/recommendations/diversity";
import type { Candidate } from "../../../../src/services/recommendations/types";

describe("diversity", () => {
  const makeCandidate = (
    id: string,
    artistKey: string,
    score: number = 10,
    exploration: boolean = false,
  ): Candidate => ({
    track: { id, title: `Title ${id}`, artist: artistKey } as any,
    artistKey,
    score,
    exploration,
    source: "artist",
    sourceLabel: "Test",
    seedRank: 0,
  });

  describe("interleavePools", () => {
    it("interleaves correctly", () => {
      const poolA = [makeCandidate("a1", "artA"), makeCandidate("a2", "artA")];
      const poolB = [makeCandidate("b1", "artB")];
      const poolC = [makeCandidate("c1", "artC"), makeCandidate("c2", "artC")];

      const result = interleavePools([poolA, poolB, poolC]);
      expect(result.map((c) => c.track.id)).toEqual([
        "a1",
        "b1",
        "c1",
        "a2",
        "c2",
      ]);
    });
  });

  describe("applyDiversity", () => {
    it("excludes seen, excluded, and seed ids", () => {
      const candidates = [
        makeCandidate("t1", "art"),
        makeCandidate("t2", "art2"),
        makeCandidate("t3", "art3"),
        makeCandidate("t4", "art4"),
      ];

      const result = applyDiversity(candidates, {
        excludeIds: new Set(["t2"]),
        seedIds: new Set(["t4"]),
      });

      expect(result.map((c) => c.track.id)).toEqual(["t1", "t3"]);
    });

    it("enforces maxPerArtist cap", () => {
      const candidates = [
        makeCandidate("t1", "art"),
        makeCandidate("t2", "art"),
        makeCandidate("t3", "art"),
        makeCandidate("t4", "art"),
        makeCandidate("t5", "art"),
      ];

      const result = applyDiversity(candidates, { maxPerArtist: 2 });
      expect(result.length).toBe(2);
      expect(result.map((c) => c.track.id)).toEqual(["t1", "t2"]);
    });
  });
});
