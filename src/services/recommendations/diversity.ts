import { WEIGHTS, artistKey, artistAffinity } from './scoring';
import type { Candidate, TasteProfile } from './types';

/**
 * Diversity pass: dedupes against known ids and recent history, caps how
 * often one artist may appear (globally and within a sliding window), and
 * enforces the exploration share. Deterministic: operates on the sorted
 * candidate order, never on Math.random.
 */

/** Round-robin merge of candidate pools so every source stays visible. */
export function interleavePools(pools: Candidate[][]): Candidate[] {
  const result: Candidate[] = [];
  const cursors = pools.map(() => 0);
  let exhausted = false;
  while (!exhausted) {
    exhausted = true;
    for (let poolIndex = 0; poolIndex < pools.length; poolIndex++) {
      const pool = pools[poolIndex];
      const cursor = cursors[poolIndex];
      if (cursor < pool.length) {
        exhausted = false;
        result.push(pool[cursor]);
        cursors[poolIndex] = cursor + 1;
      }
    }
  }
  return result;
}

export type DiversityOptions = {
  /** Ids to exclude outright (e.g. recently played tracks for "new music" sections). */
  excludeIds?: Set<string>;
  /** Seed ids that must not reappear as recommendations (the seeds themselves). */
  seedIds?: Set<string>;
  maxPerArtist?: number;
  /** Overrides the sliding-window per-artist cap (single-artist sections lift it). */
  windowMax?: number;
};

/** Applies dedupe + artist caps; preserves input order among survivors. */
export function applyDiversity(candidates: Candidate[], options: DiversityOptions = {}): Candidate[] {
  const exclude = options.excludeIds ?? new Set<string>();
  const seeds = options.seedIds ?? new Set<string>();
  const maxPerArtist = options.maxPerArtist ?? WEIGHTS.maxPerArtist;
  const windowMax = options.windowMax ?? WEIGHTS.windowMax;

  const seenIds = new Set<string>();
  const perArtist = new Map<string, number>();
  const window: string[] = [];

  const result: Candidate[] = [];
  for (const candidate of candidates) {
    const id = candidate.track.id;
    if (seenIds.has(id) || exclude.has(id) || seeds.has(id)) continue;

    const artistCount = perArtist.get(candidate.artistKey) ?? 0;
    if (artistCount >= maxPerArtist) continue;

    const inWindow = window.slice(-WEIGHTS.windowSize)
      .filter(key => key === candidate.artistKey).length;
    if (inWindow >= windowMax) continue;

    seenIds.add(id);
    perArtist.set(candidate.artistKey, artistCount + 1);
    window.push(candidate.artistKey);
    result.push(candidate);
  }
  return result;
}

/**
 * Enforces the exploration share (WEIGHTS.explorationRatio, clamped to the
 * 15-30% band): exploration candidates occupy deterministic, evenly spaced
 * slots; regular candidates fill the rest. The realized share stays inside
 * the band whenever the candidate pool is large enough to allow it, and the
 * result never floods with exploration when regular candidates run out.
 */
export function applyExplorationQuota(candidates: Candidate[], targetSize: number): { picked: Candidate[]; explorationCount: number } {
  const exploring = candidates.filter(candidate => candidate.exploration);
  const regular = candidates.filter(candidate => !candidate.exploration);
  const wanted = Math.max(1, Math.round(targetSize * WEIGHTS.explorationRatio));

  // Reserve exploration slots; keep the realized share at or below the 30%
  // band maximum while preserving as much mix size as the pool allows.
  let reserve = Math.min(wanted, exploring.length);
  for (let round = 0; round < 4; round++) {
    const total = Math.min(targetSize, regular.length + reserve);
    const capped = Math.min(reserve, Math.max(1, Math.floor(total * WEIGHTS.explorationMax)));
    if (capped === reserve) break;
    reserve = capped;
  }
  const total = Math.min(targetSize, regular.length + reserve);

  const slots = new Set<number>();
  for (let index = 0; index < reserve; index++) {
    slots.add(Math.min(total - 1, Math.round((index * total) / Math.max(1, reserve))));
  }

  const picked: Candidate[] = [];
  let regularCursor = 0;
  let exploreCursor = 0;
  let explorationCount = 0;
  for (let position = 0; position < total; position++) {
    if (slots.has(position) && exploreCursor < exploring.length) {
      picked.push(exploring[exploreCursor++]);
      explorationCount++;
    } else if (regularCursor < regular.length) {
      picked.push(regular[regularCursor++]);
    } else break; // regular exhausted and reserve already placed: stop, never flood
  }
  return { picked, explorationCount };
}

/** Flags candidates whose artist is unknown or weakly liked as exploration. */
export function isExplorationCandidate(profile: TasteProfile, artist: string): boolean {
  const key = artistKey(artist);
  const stats = profile.artistStats.get(key);
  if (!stats) return true; // completely unknown artist => exploration
  const top = profile.topArtists[0];
  if (!top) return true;
  // Affinity-based: artists with less than a quarter of the top artist's
  // affinity sit at the edge of the known taste. Uses affinity (not plays)
  // so a fresh 1-like profile still treats its liked artist as known taste.
  return artistAffinity(stats) < artistAffinity(top) / 4;
}
