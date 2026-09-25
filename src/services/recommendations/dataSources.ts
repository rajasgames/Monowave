import { fetchArtistTracks, fetchRadioTracks, searchMusic } from '../../music';
import type { Track } from '../../music';
import { TTL, getCached, getArtistId, putArtistIds, putCached } from './cache';
import { artistKey as toKey, stableHash } from './scoring';
import { isExplorationCandidate } from './diversity';
import type { Candidate, TasteProfile } from './types';

/**
 * Candidate providers. Every provider:
 * - reads through the TTL cache (no repeated network calls per refresh),
 * - throws on failure (callers isolate sections individually),
 * - returns real YouTube Music data only — nothing is invented or mocked.
 */

/** Deterministic day-stable rotation across a list (varies sections without randomness). */
export function dayRotation<T>(list: T[], salt: string): T[] {
  if (list.length <= 1) return [...list];
  const day = Math.floor(Date.now() / 86400000);
  const offset = stableHash(`${salt}:${day}`) % list.length;
  return [...list.slice(offset), ...list.slice(0, offset)];
}

function toCandidate(
  track: Track,
  profile: TasteProfile,
  source: Candidate['source'],
  sourceLabel: string,
  seedRank: number,
): Candidate {
  const key = toKey(track.artist);
  return {
    track,
    source,
    sourceLabel,
    artistKey: key,
    exploration: isExplorationCandidate(profile, track.artist),
    score: 0, // scored by the engine after collection
    seedRank,
  };
}

/** Radio (related tracks) for one seed. Real YouTube Music automix queue. */
export async function radioCandidates(seed: Track, profile: TasteProfile, seedRank: number): Promise<Candidate[]> {
  const cacheKey = `radio:${seed.id}`;
  let payload = getCached<{ tracks: Track[]; artistIds: Record<string, string> }>(cacheKey, TTL.radio);
  if (!payload) {
    payload = await fetchRadioTracks(seed.id);
    if (!payload.tracks.length) throw new Error(`No related tracks for seed ${seed.id}`);
    putCached(cacheKey, payload);
    // Remember artist channel ids in the dedicated dictionary (never evicted by pool churn).
    putArtistIds(payload.artistIds);
  }
  return payload.tracks.map(track => toCandidate(track, profile, 'radio', seed.title, seedRank));
}

/** Radio for liked seeds with day-stable rotation, merged into one pool. */
export async function likedRadioCandidates(profile: TasteProfile): Promise<Candidate[]> {
  const liked = profile.likedTracks;
  if (!liked.length) return [];
  const chosen = dayRotation(liked, 'based-on-likes').slice(0, 3);
  const settled = await Promise.allSettled(chosen.map(async (seed, index) => {
    const cacheKey = `radio:${seed.id}`;
    let payload = getCached<{ tracks: Track[]; artistIds: Record<string, string> }>(cacheKey, TTL.radio);
    if (!payload) {
      payload = await fetchRadioTracks(seed.id);
      if (payload.tracks.length) putCached(cacheKey, payload);
      else throw new Error(`No related tracks for seed ${seed.id}`);
    }
    return payload.tracks.map(track => toCandidate(track, profile, 'likes-radio', seed.title, index));
  }));
  return settled.flatMap(result => (result.status === 'fulfilled' ? result.value : []));
}

/**
 * Resolve an artist name to a VERIFIED channel browseId.
 * 1. Dictionary first (ids harvested from radio bylines — most reliable).
 * 2. Search fallback: try candidate artist items (exact title match first),
 *    and only accept a channel whose page actually yields songs — this
 *    rejects "- Topic" auto-channels that have no browsable top songs.
 * Verified ids are cached in the dictionary.
 */
export async function resolveArtistId(artistName: string): Promise<string | null> {
  const dictionaryHit = getArtistId(artistName);
  if (dictionaryHit) return dictionaryHit;
  const results = await searchMusic(artistName);
  const key = toKey(artistName);
  const matches = results.filter(item => item.kind === 'artist');
  matches.sort((a, b) => Number(toKey(b.title) === key) - Number(toKey(a.title) === key));
  if (!matches.length) throw new Error(`Artist not found: ${artistName}`);
  for (const candidate of matches.slice(0, 3)) {
    try {
      const tracks = await fetchArtistTracks(candidate.id);
      if (tracks.length) {
        putArtistIds({ [artistName]: candidate.id });
        return candidate.id;
      }
    } catch { /* try next candidate */ }
  }
  throw new Error(`No browsable artist page for ${artistName}`);
}

/** Artist page top songs. */
export async function artistCandidates(artistName: string, browseId: string, profile: TasteProfile): Promise<Candidate[]> {
  const cacheKey = `artist:${browseId}`;
  let tracks = getCached<Track[]>(cacheKey, TTL.artist);
  if (!tracks) {
    tracks = await fetchArtistTracks(browseId);
    if (!tracks.length) throw new Error(`No tracks on artist page ${artistName}`);
    putCached(cacheKey, tracks);
  }
  return tracks.map(track => toCandidate(track, profile, 'artist', artistName, 0));
}

/** Track-only search pool for a recent interest term. */
export async function searchCandidates(term: string, profile: TasteProfile): Promise<Candidate[]> {
  const cacheKey = `search:${term}`;
  let tracks = getCached<Track[]>(cacheKey, TTL.search);
  if (!tracks) {
    const results = await searchMusic(term);
    tracks = results.filter(item => item.kind === 'track' && item.track).map(item => item.track!);
    if (!tracks.length) throw new Error(`No tracks for term ${term}`);
    putCached(cacheKey, tracks);
  }
  // Search results are direct user interest: treated as regular (non-exploration)
  // even when the performing artist is otherwise unknown to the profile.
  return tracks.map(track => ({
    ...toCandidate(track, profile, 'search', term, 0),
    exploration: false,
  }));
}
