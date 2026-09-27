import { Track, Playlist, HistoryEntry } from "../core/types";
import { RepeatMode } from "../playback/types";

export const CURRENT_SCHEMA_VERSION = 1;

export type PersistedEnvelope<T> = {
  schemaVersion: number;
  savedAt: number;
  data: T;
};

export type LibraryData = {
  profileName: string;
  likedTracks: Track[];
  playlists: Playlist[];
  history: HistoryEntry[];
  queue: Track[];
  queueIndex: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
};

export const INITIAL_LIBRARY_DATA: LibraryData = {
  profileName: "",
  likedTracks: [],
  playlists: [],
  history: [],
  queue: [],
  queueIndex: 0,
  repeatMode: "off",
  isShuffled: false,
};

export type PreferencesData = {
  seekIntervalSeconds: number;
  autoplay: boolean;
  enableDiscoverMix: boolean;
  displayName: string;
};

export const INITIAL_PREFERENCES_DATA: PreferencesData = {
  seekIntervalSeconds: 10,
  autoplay: true,
  enableDiscoverMix: true,
  displayName: "",
};

export type SearchHistoryData = {
  terms: string[];
};

export const INITIAL_SEARCH_HISTORY_DATA: SearchHistoryData = {
  terms: [],
};
