import type { Track } from '../../music';
import { stableHash, artistKey as toKey, trackAffinity, artistAffinity, WEIGHTS } from './scoring';
import type { ArtistStats, BehaviorEvent, LibrarySnapshot, TasteProfile, TrackStats } from './types';

/**
 * Builds the taste profile purely from data the player already owns:
 * history (plays), liked list, playlists, plus behavior signals
 * (completions / skips / searches / playlist adds). No I/O, fully
 * deterministic: identical inputs produce an identical profile, which
 * is what keeps recommendations stable across restarts.
 */
export function buildTasteProfile(library: LibrarySnapshot, signals: BehaviorEvent[], now = Date.now()): TasteProfile {
  const trackStats = new Map<string, TrackStats>();
  const artistStats = new Map<string, ArtistStats>();
  const trackObjects = new Map<string, Track>();

  const ensureTrack = (track: Track): TrackStats => {
    trackObjects.set(track.id, track);
    let stats = trackStats.get(track.id);
    if (!stats) {
      stats = { plays: 0, completes: 0, skips: 0, quickSkips: 0, liked: false, playlistAdds: 0, lastPlayedAt: null, avgPlayFraction: null };
      trackStats.set(track.id, stats);
    }
    return stats;
  };

  const ensureArtist = (name: string): ArtistStats => {
    const key = toKey(name);
    let stats = artistStats.get(key);
    if (!stats) {
      stats = { key, name: name.trim(), plays: 0, completes: 0, likes: 0, skips: 0, quickSkips: 0, playlistAdds: 0, distinctTracks: 0, lastPlayedAt: null };
      artistStats.set(key, stats);
    }
    return stats;
  };

  // Plays come from the existing history (already capped at 300 by the player).
  const fractionSums = new Map<string, { sum: number; count: number }>();
  for (const entry of library.history) {
    const track = entry?.track;
    if (!track?.id) continue;
    const stats = ensureTrack(track);
    stats.plays += 1;
    stats.lastPlayedAt = stats.lastPlayedAt === null ? entry.playedAt : Math.max(stats.lastPlayedAt, entry.playedAt);
    const artist = ensureArtist(track.artist);
    artist.plays += 1;
    artist.lastPlayedAt = artist.lastPlayedAt === null ? entry.playedAt : Math.max(artist.lastPlayedAt, entry.playedAt);
  }
  // Distinct tracks per artist (after all plays are registered).
  for (const track of trackObjects.values()) {
    const stats = artistStats.get(toKey(track.artist));
    if (stats) stats.distinctTracks += 1;
  }

  // Behavior signals refine the picture.
  let lastSignalAt = 0;
  for (const event of signals) {
    if (event.at > lastSignalAt) lastSignalAt = event.at;
    if (event.type === 'search') continue; // handled below
    if (!event.trackId) continue;
    const stats = trackStats.get(event.trackId);
    if (!stats) continue; // track never made it into history (e.g. failed resolve): ignore
    const artist = artistStats.get(toKey(event.artist ?? ''));
    if (event.type === 'complete') {
      stats.completes += 1;
      if (artist) artist.completes += 1;
    } else if (event.type === 'skip') {
      const quick = (event.fraction ?? 0) < WEIGHTS.quickSkipFraction;
      if (quick) stats.quickSkips += 1; else stats.skips += 1;
      if (artist) { if (quick) artist.quickSkips += 1; else artist.skips += 1; }
      const fractions = fractionSums.get(event.trackId) ?? { sum: 0, count: 0 };
      fractions.sum += event.fraction ?? 0;
      fractions.count += 1;
      fractionSums.set(event.trackId, fractions);
    } else if (event.type === 'playlist_add') {
      stats.playlistAdds += 1;
      if (artist) artist.playlistAdds += 1;
    }
  }
  for (const [trackId, fractions] of fractionSums) {
    const stats = trackStats.get(trackId);
    if (stats) stats.avgPlayFraction = fractions.count ? fractions.sum / fractions.count : null;
  }

  // Likes come straight from the library's liked list (most recent first).
  const likedTracks: Track[] = [];
  for (const track of library.liked) {
    if (!track?.id || likedTracks.some(liked => liked.id === track.id)) continue;
    likedTracks.push(track);
    const stats = ensureTrack(track);
    stats.liked = true;
    const artist = ensureArtist(track.artist);
    artist.likes += 1;
  }

  const searchTerms: { term: string; at: number }[] = [];
  for (const event of signals) {
    if (event.type !== 'search' || !event.term) continue;
    if (searchTerms.some(entry => entry.term === event.term)) continue;
    searchTerms.push({ term: event.term, at: event.at });
  }
  searchTerms.sort((a, b) => b.at - a.at);

  // Affinity-ranked views.
  const topArtists = [...artistStats.values()]
    .map(stats => ({ ...stats }))
    .map(stats => ({ stats, affinity: artistAffinity(stats) }))
    .filter(entry => entry.affinity > 0)
    .sort((a, b) => b.affinity - a.affinity || (b.stats.lastPlayedAt ?? 0) - (a.stats.lastPlayedAt ?? 0))
    .map(entry => entry.stats);

  // Seed tracks: likes first (strongest explicit signal), then most-completed, then repeat listens.
  const seeds: Track[] = [];
  const pushSeed = (track: Track) => { if (track?.id && !seeds.some(seed => seed.id === track.id)) seeds.push(track); };
  likedTracks.slice(0, 3).forEach(pushSeed);
  const completionsFirst = [...trackStats.entries()]
    .filter(([, stats]) => stats.completes > 0)
    .sort((a, b) =>
      b[1].completes - a[1].completes
      || (b[1].lastPlayedAt ?? 0) - (a[1].lastPlayedAt ?? 0)
      || b[1].plays - a[1].plays);
  for (const [id] of completionsFirst) { if (seeds.length >= 6) break; const track = trackObjects.get(id); if (track) pushSeed(track); }
  const repeatsFirst = [...trackStats.entries()]
    .filter(([, stats]) => stats.plays > 1 && stats.completes === 0 && !stats.liked)
    .sort((a, b) => (b[1].lastPlayedAt ?? 0) - (a[1].lastPlayedAt ?? 0));
  for (const [id] of repeatsFirst) { if (seeds.length >= 6) break; const track = trackObjects.get(id); if (track) pushSeed(track); }

  const strongSignalCount =
    likedTracks.length
    + [...trackStats.values()].reduce((sum, stats) => sum + stats.completes, 0)
    + [...trackStats.values()].filter(stats => stats.plays > 1).length;

  // Deterministic profile version: changes whenever any input changes.
  const versionInput = JSON.stringify([
    library.history.map(entry => entry?.track?.id ?? ''),
    library.liked.map(track => track?.id ?? ''),
    library.playlists.map(list => list.tracks.map(track => track?.id ?? '').join(',')),
    signals.length,
    lastSignalAt,
  ]);
  const version = `${stableHash(versionInput).toString(36)}-${library.history.length}-${library.liked.length}`;

  return {
    builtAt: now,
    version,
    trackStats,
    artistStats,
    topArtists,
    seedTracks: seeds,
    likedTracks,
    searchTerms: searchTerms.slice(0, 12),
    strongSignalCount,
    historyIds: new Set(trackStats.keys()),
  };
}
