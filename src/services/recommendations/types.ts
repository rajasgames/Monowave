import type { Track } from '../../music';

/** Behavior signals the engine records while the app is used. */
export type SignalType = 'complete' | 'skip' | 'search' | 'playlist_add';

export type BehaviorEvent = {
  /** Epoch milliseconds when the event happened. */
  at: number;
  type: SignalType;
  /** Video id for track-scoped events (complete/skip/playlist_add). */
  trackId?: string;
  artist?: string;
  title?: string;
  /** Fraction (0..1) of the track that was actually played before a skip. */
  fraction?: number;
  /** Normalized search term (search events only). */
  term?: string;
};

/** A minimal shape of the player library the engine is allowed to read. */
export type LibrarySnapshot = {
  history: { track: Track; playedAt: number }[];
  liked: Track[];
  playlists: { id: string; name: string; tracks: Track[] }[];
};

/** Per-track aggregates derived from history + signals. */
export type TrackStats = {
  plays: number;
  completes: number;
  skips: number;
  quickSkips: number;
  liked: boolean;
  playlistAdds: number;
  lastPlayedAt: number | null;
  avgPlayFraction: number | null;
};

/** Per-artist aggregates derived from track stats. */
export type ArtistStats = {
  key: string;
  name: string;
  plays: number;
  completes: number;
  likes: number;
  skips: number;
  quickSkips: number;
  playlistAdds: number;
  distinctTracks: number;
  lastPlayedAt: number | null;
};

/** Aggregated taste profile. Pure data, rebuilt deterministically from inputs. */
export type TasteProfile = {
  builtAt: number;
  /** Deterministic hash of all inputs; changes whenever listening data changes. */
  version: string;
  trackStats: Map<string, TrackStats>;
  artistStats: Map<string, ArtistStats>;
  /** Artist affinity sorted descending, filtered to positive affinity. */
  topArtists: ArtistStats[];
  /** Strongest seed tracks (likes first, then completions, then repeats). */
  seedTracks: Track[];
  likedTracks: Track[];
  /** Unique recent search terms, newest first. */
  searchTerms: { term: string; at: number }[];
  /** likes + completes + repeat-play tracks; drives cold-start gating. */
  strongSignalCount: number;
  /** Video ids currently in listening history (for dedupe). */
  historyIds: Set<string>;
};

/** A recommended track candidate with provenance and engine score. */
export type Candidate = {
  track: Track;
  source: 'radio' | 'likes-radio' | 'artist' | 'search';
  /** Human label of where this came from (seed track title / artist name / term). */
  sourceLabel: string;
  artistKey: string;
  /** True when the candidate artist is outside (or at the edge of) the known taste profile. */
  exploration: boolean;
  score: number;
  /** Rank of the seed that produced this candidate (0 = strongest seed). */
  seedRank: number;
};

export type SectionKind =
  | 'discover-mix'
  | 'recently-played'
  | 'because-you-played'
  | 'more-from-artist'
  | 'based-on-likes'
  | 'rediscover';

export type RecoSection = {
  kind: SectionKind;
  title: string;
  subtitle: string;
  tracks: Track[];
  /** Optional context for UI (seed title, artist name). */
  context?: string;
};

export type RecoStatus = 'cold' | 'loading' | 'partial' | 'ready';

export type RecoResult = {
  status: RecoStatus;
  sections: RecoSection[];
  /** Honest notes about why sections are missing (shown only in diagnostics). */
  notes: string[];
  builtAt: number;
};
