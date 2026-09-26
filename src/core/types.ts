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
  durationSeconds?: number;
};

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
