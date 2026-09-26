import {
  createInitialQueue,
  getNextIndex,
  getPreviousIndex,
  enqueue,
  playNext,
  removeFromQueue,
  reorderQueue,
  toggleShuffle,
  cycleRepeatMode,
} from "../../../src/playback/queue";
import { Track } from "../../../src/core/types";

describe("Playback queue logic", () => {
  const createMockTrack = (id: string, title: string): Track => ({
    id: `youtube:${id}`,
    provider: "youtube",
    sourceId: id,
    title,
    artist: "Artist",
  });

  const tracks: Track[] = [
    createMockTrack("1", "Track 1"),
    createMockTrack("2", "Track 2"),
    createMockTrack("3", "Track 3"),
  ];

  it("cycles through repeat modes correctly", () => {
    expect(cycleRepeatMode("off")).toBe("all");
    expect(cycleRepeatMode("all")).toBe("one");
    expect(cycleRepeatMode("one")).toBe("off");
  });

  it("advances sequentially when repeat is off", () => {
    const queue = createInitialQueue(tracks, 0, false, "off");
    expect(getNextIndex(queue)).toBe(1);

    const atEnd = { ...queue, currentIndex: 2 };
    expect(getNextIndex(atEnd)).toBeNull();
  });

  it("wraps around when repeat is all", () => {
    const queue = createInitialQueue(tracks, 2, false, "all");
    expect(getNextIndex(queue)).toBe(0);

    const atStart = { ...queue, currentIndex: 0 };
    expect(getPreviousIndex(atStart)).toBe(2);
  });

  it("repeats the same index when repeat is one", () => {
    const queue = createInitialQueue(tracks, 1, false, "one");
    expect(getNextIndex(queue)).toBe(1);
    expect(getPreviousIndex(queue)).toBe(1);
  });

  it("adds tracks to end with enqueue", () => {
    const queue = createInitialQueue(tracks, 0);
    const newTrack = createMockTrack("4", "Track 4");
    const updated = enqueue(queue, newTrack);
    expect(updated.items.length).toBe(4);
    expect(updated.items[3].id).toBe("youtube:4");
  });

  it("inserts tracks immediately after current track with playNext", () => {
    const queue = createInitialQueue(tracks, 0);
    const newTrack = createMockTrack("next", "Play Next Track");
    const updated = playNext(queue, newTrack);
    expect(updated.items[1].id).toBe("youtube:next");
    expect(updated.items.length).toBe(4);
  });

  it("removes tracks from queue safely adjusting currentIndex", () => {
    const queue = createInitialQueue(tracks, 2);
    // Remove track before current
    const updated = removeFromQueue(queue, 0);
    expect(updated.items.length).toBe(2);
    expect(updated.currentIndex).toBe(1); // Shifted down
  });

  it("reorders queue and maintains active track identity", () => {
    const queue = createInitialQueue(tracks, 0);
    // Move track 0 to index 2
    const updated = reorderQueue(queue, 0, 2);
    expect(updated.items[2].id).toBe("youtube:1");
    expect(updated.currentIndex).toBe(2);
  });

  it("toggles shuffle preserving current track in first position", () => {
    const queue = createInitialQueue(tracks, 1, false);
    const shuffled = toggleShuffle(queue);
    expect(shuffled.isShuffled).toBe(true);
    expect(shuffled.shuffledIndices[0]).toBe(1);
    expect(shuffled.shuffledIndices.length).toBe(3);
  });
});
