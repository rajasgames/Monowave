import { Track, Playlist, HistoryEntry } from "../core/types";
import {
  LibraryData,
  INITIAL_LIBRARY_DATA,
  CURRENT_SCHEMA_VERSION,
  PersistedEnvelope,
} from "./schemas";

// Safely normalize any legacy or partial track into a valid domain Track
export function normalizeLegacyTrack(raw: any): Track | null {
  if (!raw || typeof raw !== "object") return null;
  const rawId =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw.sourceId === "string"
        ? raw.sourceId
        : null;
  const title = typeof raw.title === "string" ? raw.title : "Untitled Track";
  if (!rawId) return null;

  const sourceId = rawId.startsWith("youtube:")
    ? rawId.replace("youtube:", "")
    : rawId;
  const id = `youtube:${sourceId}`;
  const artist = typeof raw.artist === "string" ? raw.artist : "Unknown artist";
  const artwork =
    typeof raw.artwork === "string"
      ? raw.artwork
      : typeof raw.cover === "string"
        ? raw.cover
        : undefined;
  const durationSeconds =
    typeof raw.durationSeconds === "number"
      ? raw.durationSeconds
      : typeof raw.duration === "number"
        ? raw.duration
        : undefined;

  return {
    id,
    provider: "youtube",
    sourceId,
    title,
    artist,
    artwork,
    durationSeconds,
  };
}

export function migrateLibraryPayload(rawJson: string | null): LibraryData {
  if (!rawJson) {
    return { ...INITIAL_LIBRARY_DATA };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ...INITIAL_LIBRARY_DATA };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ...INITIAL_LIBRARY_DATA };
  }

  // If already wrapped in versioned envelope
  if (typeof parsed.schemaVersion === "number") {
    if (parsed.schemaVersion === CURRENT_SCHEMA_VERSION && parsed.data) {
      return sanitizeLibraryData(parsed.data);
    }
  }

  // Legacy unversioned payload migration
  return migrateFromLegacyV0(parsed);
}

function migrateFromLegacyV0(legacy: any): LibraryData {
  const profileName = typeof legacy.name === "string" ? legacy.name : "";
  const repeatMode = ["off", "all", "one"].includes(legacy.repeat)
    ? legacy.repeat
    : "off";
  const isShuffled = Boolean(legacy.shuffle);
  const queueIndex =
    typeof legacy.index === "number" ? Math.max(0, legacy.index) : 0;

  const likedTracks: Track[] = Array.isArray(legacy.liked)
    ? legacy.liked
        .map(normalizeLegacyTrack)
        .filter((t: Track | null): t is Track => t !== null)
    : [];

  const queue: Track[] = Array.isArray(legacy.queue)
    ? legacy.queue
        .map(normalizeLegacyTrack)
        .filter((t: Track | null): t is Track => t !== null)
    : [];

  const playlists: Playlist[] = Array.isArray(legacy.playlists)
    ? legacy.playlists.map((p: any) => ({
        id:
          typeof p.id === "string" ? p.id : `pl_${Date.now()}_${Math.random()}`,
        name: typeof p.name === "string" ? p.name : "Untitled Playlist",
        tracks: Array.isArray(p.tracks)
          ? p.tracks
              .map(normalizeLegacyTrack)
              .filter((t: Track | null): t is Track => t !== null)
          : [],
        createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
        updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
      }))
    : [];

  const history: HistoryEntry[] = Array.isArray(legacy.history)
    ? legacy.history
        .map((h: any) => {
          const track = normalizeLegacyTrack(h.track);
          if (!track) return null;
          return {
            id:
              typeof h.id === "string"
                ? h.id
                : `hist_${Date.now()}_${Math.random()}`,
            track,
            startedAt:
              typeof h.playedAt === "number"
                ? h.playedAt
                : typeof h.startedAt === "number"
                  ? h.startedAt
                  : Date.now(),
          };
        })
        .filter((h: HistoryEntry | null): h is HistoryEntry => h !== null)
    : [];

  return {
    profileName,
    likedTracks,
    playlists,
    history,
    queue,
    queueIndex,
    repeatMode,
    isShuffled,
  };
}

function sanitizeLibraryData(data: any): LibraryData {
  return {
    profileName: typeof data.profileName === "string" ? data.profileName : "",
    likedTracks: Array.isArray(data.likedTracks)
      ? data.likedTracks
          .map(normalizeLegacyTrack)
          .filter((t: Track | null): t is Track => t !== null)
      : [],
    playlists: Array.isArray(data.playlists)
      ? data.playlists.map((p: any) => ({
          id: String(p.id || ""),
          name: String(p.name || "Untitled Playlist"),
          tracks: Array.isArray(p.tracks)
            ? p.tracks
                .map(normalizeLegacyTrack)
                .filter((t: Track | null): t is Track => t !== null)
            : [],
          createdAt: Number(p.createdAt || Date.now()),
          updatedAt: Number(p.updatedAt || Date.now()),
        }))
      : [],
    history: Array.isArray(data.history)
      ? data.history
          .map((h: any) => {
            const track = normalizeLegacyTrack(h.track);
            if (!track) return null;
            return {
              id: String(h.id || ""),
              track,
              startedAt: Number(h.startedAt || Date.now()),
              completed: Boolean(h.completed),
              listenedSeconds:
                typeof h.listenedSeconds === "number"
                  ? h.listenedSeconds
                  : undefined,
            };
          })
          .filter((h: HistoryEntry | null): h is HistoryEntry => h !== null)
      : [],
    queue: Array.isArray(data.queue)
      ? data.queue
          .map(normalizeLegacyTrack)
          .filter((t: Track | null): t is Track => t !== null)
      : [],
    queueIndex: typeof data.queueIndex === "number" ? data.queueIndex : 0,
    repeatMode: ["off", "all", "one"].includes(data.repeatMode)
      ? data.repeatMode
      : "off",
    isShuffled: Boolean(data.isShuffled),
  };
}

export function createPersistedEnvelope<T>(data: T): PersistedEnvelope<T> {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    savedAt: Date.now(),
    data,
  };
}
