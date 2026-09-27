export type ProviderId = "youtube";

export type Track = {
  id: string; // Stable Monowave id, e.g. youtube:<videoId>
  provider: ProviderId;
  sourceId: string; // Raw provider id, e.g. videoId
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  artwork?: string;
  cover?: string; // Alias for UI / backwards compatibility
  durationSeconds?: number;
  duration?: number; // Alias for UI / backwards compatibility
};

export function getTrackArtwork(track?: Track | null): string | undefined {
  if (!track) return undefined;
  return track.artwork || track.cover;
}

export function getTrackDuration(track?: Track | null): number {
  if (!track) return 0;
  return track.durationSeconds ?? track.duration ?? 0;
}

export function getTrackSourceId(track?: Track | null): string {
  if (!track) return "";
  if (track.sourceId) return track.sourceId;
  if (track.id.startsWith("youtube:")) return track.id.replace("youtube:", "");
  return track.id;
}

export function toDomainTrack(raw: any): Track {
  const sourceId =
    typeof raw?.sourceId === "string"
      ? raw.sourceId
      : typeof raw?.id === "string"
        ? raw.id.replace(/^youtube:/, "")
        : "";
  const id = raw?.id?.startsWith("youtube:")
    ? raw.id
    : `youtube:${sourceId || "unknown"}`;
  const title = typeof raw?.title === "string" ? raw.title : "Untitled Track";
  const artist =
    typeof raw?.artist === "string" ? raw.artist : "Unknown artist";
  const artwork =
    typeof raw?.artwork === "string"
      ? raw.artwork
      : typeof raw?.cover === "string"
        ? raw.cover
        : undefined;
  const durationSeconds =
    typeof raw?.durationSeconds === "number"
      ? raw.durationSeconds
      : typeof raw?.duration === "number"
        ? raw.duration
        : undefined;

  return {
    id,
    provider: "youtube",
    sourceId: sourceId || id,
    title,
    artist,
    artistId: typeof raw?.artistId === "string" ? raw.artistId : undefined,
    album: typeof raw?.album === "string" ? raw.album : undefined,
    albumId: typeof raw?.albumId === "string" ? raw.albumId : undefined,
    artwork,
    cover: artwork,
    durationSeconds,
    duration: durationSeconds,
  };
}

export type Playlist = {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
};

export type HistoryEntry = {
  id: string;
  track: Track;
  startedAt: number;
  completed?: boolean;
  listenedSeconds?: number;
};

export type ResolvedStream = {
  url: string;
  userAgent?: string;
  mimeType?: string;
  bitrate?: number;
  expiresAt: number;
  resolvedBy: string;
};

export type SearchResult = {
  tracks: Track[];
  artists: Array<{
    id: string;
    name: string;
    artwork?: string;
    subscribers?: string;
  }>;
  albums: Array<{
    id: string;
    title: string;
    artist: string;
    artwork?: string;
    year?: string;
  }>;
  playlists: Array<{
    id: string;
    title: string;
    itemCount?: number;
    artwork?: string;
    author?: string;
  }>;
};
