import { getKV } from './storage';
import type { BehaviorEvent, SignalType } from './types';

/**
 * Behavior signal store. Records only what the player cannot already tell us:
 * completions, skips (with played fraction), search terms, playlist adds.
 * Plays and likes are NOT stored here — they already live in the player's
 * history and liked list, and the profile reads them from there directly.
 */
const STORAGE_KEY = 'monowave:signals:v1';
const MAX_EVENTS = 600;          // hard cap: aggregated, never grows unbounded
const SAVE_DEBOUNCE_MS = 500;

let events: BehaviorEvent[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function isValidEvent(value: unknown): value is BehaviorEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  return typeof event.at === 'number'
    && (event.type === 'complete' || event.type === 'skip' || event.type === 'search' || event.type === 'playlist_add');
}

/** Loads stored signals once. Safe to call repeatedly; idempotent. */
export async function initSignals(): Promise<void> {
  if (loaded) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const raw = await getKV().get(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) events = parsed.filter(isValidEvent).slice(-MAX_EVENTS);
      }
    } catch { /* corrupted store: start empty, never crash the app */ }
    loaded = true;
  })();
  return loading;
}

/** Snapshot of all recorded signals (newest last). */
export function getSignals(): BehaviorEvent[] {
  return [...events];
}

/** Lets UI consumers regenerate recommendations when behavior changes. */
export function subscribeSignals(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function persist(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    getKV().set(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS))).catch(() => { /* storage full/unavailable: keep in-memory */ });
  }, SAVE_DEBOUNCE_MS);
}

function append(event: BehaviorEvent): void {
  events = [...events.slice(-(MAX_EVENTS - 1)), event];
  persist();
  notifyListeners();
}

export function recordComplete(track: { id: string; artist: string; title: string }): void {
  if (!track?.id) return;
  append({ at: Date.now(), type: 'complete' as SignalType, trackId: track.id, artist: track.artist, title: track.title });
}

/** fractionPlayed < 0.9 is a skip; from 0.9 it is honestly a near-full listen. */
export function recordSkip(track: { id: string; artist: string; title: string }, fractionPlayed: number): void {
  if (!track?.id) return;
  const fraction = Number.isFinite(fractionPlayed) ? Math.max(0, Math.min(1, fractionPlayed)) : 0;
  if (fraction >= 0.9) { recordComplete(track); return; }
  append({ at: Date.now(), type: 'skip' as SignalType, trackId: track.id, artist: track.artist, title: track.title, fraction });
}

export function recordSearch(term: string): void {
  const clean = term.trim().toLowerCase();
  if (!clean || clean.length > 120) return;
  // Collapse consecutive duplicates of the same term (retyping the same query).
  const last = events.at(-1);
  if (last?.type === 'search' && last.term === clean) return;
  append({ at: Date.now(), type: 'search' as SignalType, term: clean });
}

export function recordPlaylistAdd(track: { id: string; artist: string; title: string }): void {
  if (!track?.id) return;
  append({ at: Date.now(), type: 'playlist_add' as SignalType, trackId: track.id, artist: track.artist, title: track.title });
}

/** Clears all signals (used by tests; the app keeps them capped instead). */
export function resetSignals(): void {
  events = [];
  persist();
  notifyListeners();
}

/** Test-only seam: replace the in-memory list (tests re-init afterwards). */
export function __setSignalsForTests(next: BehaviorEvent[]): void {
  events = next.filter(isValidEvent);
  loaded = true;
  notifyListeners();
}
