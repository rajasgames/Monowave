import { artistKey } from './scoring';
import { getKV } from './storage';

/**
 * Persisted TTL cache for network candidates (radios, artist pages, searches).
 * - Every entry carries its fetch time and TTL; expired entries are dropped lazily.
 * - Hard entry cap with oldest-first eviction, plus a per-entry track cap, so
 *   storage can never grow unbounded.
 * - Cache invalidation: per-source TTLs + explicit bump on preference-changing events.
 */
const STORAGE_KEY = 'monowave:cache:v1';
const MAX_ENTRIES = 30;      // hard cap on cached fetches
const MAX_TRACKS_PER_ENTRY = 60; // keeps each serialized entry small
const SAVE_DEBOUNCE_MS = 800;

/**
 * Artist name -> channel id dictionary. Stored separately from the LRU
 * fetch cache: one radio response can carry ~50 artist ids, which would
 * evict the pools themselves. Ids are tiny and reusable across sessions.
 */
const ARTIST_IDS_KEY = 'monowave:artistids:v1';
const MAX_ARTIST_IDS = 300;
let artistIds = new Map<string, string>();
let artistIdsLoaded = false;
let artistIdsTimer: ReturnType<typeof setTimeout> | null = null;

export const TTL = {
  radio: 6 * 3600_000,       // related/radio queue for a seed track
  artist: 12 * 3600_000,     // artist top songs
  search: 4 * 3600_000,      // search result pool
  mix: 30 * 60_000,          // built Discover Mix (short: rebuilt often from same pools)
} as const;

type Entry = { at: number; value: unknown };

let entries = new Map<string, Entry>();
let hydrated = false;
let hydrating: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function isValid(value: unknown): value is Record<string, Entry> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every(entry =>
    entry && typeof entry === 'object' && typeof (entry as Entry).at === 'number' && 'value' in entry);
}

export async function initCache(): Promise<void> {
  if (hydrated) return;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const raw = await getKV().get(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) entries = new Map(Object.entries(parsed).slice(0, MAX_ENTRIES));
      }
    } catch { /* corrupted cache: start empty */ }
    hydrated = true;
  })();
  return hydrating;
}

function persist(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const flat: Record<string, Entry> = {};
    let index = 0;
    for (const [key, entry] of entries) { // Map preserves insertion order = recency
      if (index++ >= MAX_ENTRIES) break;
      flat[key] = entry;
    }
    getKV().set(STORAGE_KEY, JSON.stringify(flat)).catch(() => { /* non-fatal */ });
  }, SAVE_DEBOUNCE_MS);
}

function evictIfNeeded(): void {
  while (entries.size >= MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

export function getCached<T>(key: string, ttl: number): T | null {
  const entry = entries.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > ttl) { entries.delete(key); persist(); return null; }
  // Refresh insertion order so the map stays LRU-ordered.
  entries.delete(key);
  entries.set(key, entry);
  return entry.value as T;
}

export function putCached(key: string, value: unknown, trackCap = MAX_TRACKS_PER_ENTRY): void {
  evictIfNeeded();
  const capped = Array.isArray(value) ? value.slice(0, trackCap) : value;
  entries.delete(key);
  entries.set(key, { at: Date.now(), value: capped });
  persist();
}

export function clearCache(): void {
  entries = new Map();
  persist();
}

/** Cache version bump: call when the user's taste changed in a way that should invalidate short-TTL content. */
export function noteTasteChanged(): void {
  // Short-TTL entries (mix) are invalidated; pools keep their longer TTLs
  // because candidate pools do not encode preferences, only raw provider data.
  const mixPrefix = 'mix:';
  for (const key of [...entries.keys()]) {
    if (key.startsWith(mixPrefix)) entries.delete(key);
  }
  persist();
}

/** Test-only: reset module state. */
export function __resetCacheForTests(): void {
  entries = new Map();
  artistIds = new Map();
  artistIdsLoaded = false;
  hydrated = false;
  hydrating = null;
}

function persistArtistIds(): void {
  if (artistIdsTimer) clearTimeout(artistIdsTimer);
  artistIdsTimer = setTimeout(() => {
    artistIdsTimer = null;
    const flat: Record<string, string> = {};
    let index = 0;
    for (const [key, value] of artistIds) {
      if (index++ >= MAX_ARTIST_IDS) break;
      flat[key] = value;
    }
    getKV().set(ARTIST_IDS_KEY, JSON.stringify(flat)).catch(() => { /* non-fatal */ });
  }, SAVE_DEBOUNCE_MS);
}

export async function initArtistIds(): Promise<void> {
  if (artistIdsLoaded) return;
  try {
    const raw = await getKV().get(ARTIST_IDS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        artistIds = new Map(Object.entries(parsed).slice(0, MAX_ARTIST_IDS));
      }
    }
  } catch { /* corrupted: start empty */ }
  artistIdsLoaded = true;
}

export function getArtistId(name: string): string | null {
  return artistIds.get(artistKey(name)) ?? null;
}

/** Merges a radio payload's artist ids into the persistent dictionary (LRU-free). */
export function putArtistIds(ids: Record<string, string>): void {
  for (const [name, browseId] of Object.entries(ids)) {
    const key = artistKey(name);
    if (!key || !browseId) continue;
    artistIds.delete(key);
    artistIds.set(key, browseId);
  }
  while (artistIds.size > MAX_ARTIST_IDS) {
    const oldest = artistIds.keys().next().value;
    if (oldest === undefined) break;
    artistIds.delete(oldest);
  }
  persistArtistIds();
}
