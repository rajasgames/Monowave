import {
  migrateLibraryPayload,
  normalizeLegacyTrack,
} from "../../../src/storage/migrations";
import { LibraryRepository } from "../../../src/storage/libraryRepository";
import { INITIAL_LIBRARY_DATA } from "../../../src/storage/schemas";

describe("Storage Migrations and Repository", () => {
  it("normalizes legacy track objects accurately", () => {
    const legacy = {
      id: "video123",
      title: "Legacy Song",
      artist: "Legacy Artist",
      cover: "https://img.com/cover.jpg",
      duration: 180,
    };
    const domain = normalizeLegacyTrack(legacy);
    expect(domain).not.toBeNull();
    expect(domain?.id).toBe("youtube:video123");
    expect(domain?.provider).toBe("youtube");
    expect(domain?.sourceId).toBe("video123");
    expect(domain?.artwork).toBe("https://img.com/cover.jpg");
    expect(domain?.durationSeconds).toBe(180);
  });

  it("migrates legacy v0 unversioned state to domain LibraryData", () => {
    const legacyPayload = JSON.stringify({
      queue: [{ id: "track1", title: "Song 1", artist: "Artist 1" }],
      index: 0,
      liked: [{ id: "liked1", title: "Liked 1", artist: "Artist 1" }],
      playlists: [
        {
          id: "pl1",
          name: "Favorites",
          tracks: [{ id: "plTrack1", title: "Play Track", artist: "Artist" }],
        },
      ],
      history: [
        {
          track: { id: "hist1", title: "Hist 1", artist: "Artist" },
          playedAt: 12345678,
        },
      ],
      repeat: "all",
      shuffle: true,
      name: "Raja",
    });

    const migrated = migrateLibraryPayload(legacyPayload);
    expect(migrated.profileName).toBe("Raja");
    expect(migrated.repeatMode).toBe("all");
    expect(migrated.isShuffled).toBe(true);
    expect(migrated.likedTracks.length).toBe(1);
    expect(migrated.likedTracks[0].id).toBe("youtube:liked1");
    expect(migrated.playlists.length).toBe(1);
    expect(migrated.playlists[0].name).toBe("Favorites");
    expect(migrated.history.length).toBe(1);
    expect(migrated.history[0].track.id).toBe("youtube:hist1");
    expect(migrated.history[0].startedAt).toBe(12345678);
  });

  it("safely handles corrupted or empty JSON inputs", () => {
    expect(migrateLibraryPayload(null)).toEqual(INITIAL_LIBRARY_DATA);
    expect(migrateLibraryPayload("{ bad json")).toEqual(INITIAL_LIBRARY_DATA);
    expect(migrateLibraryPayload("123")).toEqual(INITIAL_LIBRARY_DATA);
  });

  it("loads and saves library data via LibraryRepository", async () => {
    const repo = new LibraryRepository();
    const initial = await repo.load();
    expect(initial.likedTracks).toEqual([]);

    const updated = {
      ...initial,
      profileName: "Music Lover",
      likedTracks: [
        {
          id: "youtube:songA",
          provider: "youtube" as const,
          sourceId: "songA",
          title: "Song A",
          artist: "Artist A",
        },
      ],
    };

    await repo.save(updated);
    const loaded = await repo.load();
    expect(loaded.profileName).toBe("Music Lover");
    expect(loaded.likedTracks.length).toBe(1);
    expect(loaded.likedTracks[0].id).toBe("youtube:songA");
  });
});
