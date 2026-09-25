import type { ArtistStats, TasteProfile } from './types';

/**
 * THE single tuning location for the recommendation engine.
 * Every weight the engine uses lives here; nothing else in the codebase
 * hardcodes preference numbers.
 */
export const WEIGHTS = {
  // --- taste profile affinity (per track / per artist) ---
  like: 3.0,               // explicit like: strongest signal
  completion: 1.6,         // listened to the end
  play: 0.5,               // plain play (weaker than finishing)
  playlistAdd: 1.2,        // deliberately saved into a playlist
  skip: -2.0,              // advanced away mid-track
  quickSkip: -2.6,         // skipped before QUICK_SKIP_FRACTION was played
  quickSkipFraction: 0.35, // below this played fraction a skip counts as "quick"
  maxTrackWeight: 6.0,     // cap per-track affinity so one obsession cannot dominate

  // --- candidate scoring ---
  artistAffinity: 1.4,     // x normalized artist affinity (0..1 of top artist)
  trackAffinity: 1.1,      // x normalized prior track affinity (only when seen before)
  seedStrength: 1.0,       // x seed rank decay (stronger seed => related tracks score higher)
  seedDecay: 0.75,         // each further seed is worth 75% of the previous one
  searchInterest: 1.4,     // candidate artist/term matches a recent search term
  freshness: 0.35,         // candidate the user has never played or liked
  recency: 0.35,           // x recency of the seed's last strong listen (log decay)
  explorationBonus: 0.35,  // taste-linked novelty bump for exploration candidates
  jitter: 0.2,             // deterministic hash tie-break amplitude (no Math.random)

  // --- diversity ---
  maxPerArtist: 4,         // hard cap per artist inside one section
  windowSize: 4,           // sliding window for local artist spacing
  windowMax: 2,            // max same artist within any windowSize consecutive picks

  // --- shaping ---
  explorationRatio: 0.2,   // target share of exploration candidates (kept within 0.15..0.30)
  explorationMax: 0.30,    // hard upper bound of the exploration share
  explorationMin: 0.15,    // hard lower bound of the exploration share
  mixMin: 20,              // Discover Mix minimum target size
  mixMax: 30,              // Discover Mix maximum size
  mixAbsoluteMin: 12,      // below this many real candidates the mix is not shown
  mixPerArtist: 5,         // per-artist cap inside the mix (slightly looser than sections)
  sectionSize: 10,         // default size of a per-source section
  coldStartStrongSignals: 3, // strong signals needed before the Discover Mix appears
} as const;

/** FNV-1a hash: stable across restarts, used for deterministic tie-breaks. */
export function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Deterministic jitter in [-amplitude/2, amplitude/2]; stable per track+profile. */
export function deterministicJitter(seed: string, amplitude: number): number {
  return ((stableHash(seed) / 0xffffffff) - 0.5) * amplitude;
}

/** Normalizes artist names into comparable keys ("Artist - Topic" -> "artist"). */
export function artistKey(name: string): string {
  return name.toLowerCase()
    .replace(/\s*-\s*topic$/i, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Raw affinity of one track from its stats (uses only WEIGHTS). */
export function trackAffinity(stats: { plays: number; completes: number; liked: boolean; playlistAdds: number; skips: number; quickSkips: number }): number {
  const positive = (stats.liked ? WEIGHTS.like : 0)
    + stats.completes * WEIGHTS.completion
    + stats.plays * WEIGHTS.play
    + stats.playlistAdds * WEIGHTS.playlistAdd;
  const negative = stats.skips * Math.abs(WEIGHTS.skip) + stats.quickSkips * Math.abs(WEIGHTS.quickSkip);
  return Math.max(0, Math.min(WEIGHTS.maxTrackWeight, positive - negative));
}

/** Raw affinity of one artist from its stats (uses only WEIGHTS). */
export function artistAffinity(stats: Pick<ArtistStats, 'plays' | 'completes' | 'likes' | 'skips' | 'quickSkips' | 'playlistAdds'>): number {
  return Math.max(0,
    stats.likes * WEIGHTS.like
    + stats.completes * WEIGHTS.completion
    + stats.plays * WEIGHTS.play
    + stats.playlistAdds * WEIGHTS.playlistAdd
    + stats.skips * WEIGHTS.skip
    + stats.quickSkips * (WEIGHTS.quickSkip));
}

/** Log recency decay: 1.0 for "now", falls off across days. */
export function recencyFactor(lastPlayedAt: number | null, now: number): number {
  if (!lastPlayedAt) return 0;
  const days = Math.max(0, (now - lastPlayedAt) / 86400000);
  return 1 / (1 + days);
}

export type ScoreContext = {
  profile: TasteProfile;
  seedRank: number;
  maxArtistAffinity: number;
  now: number;
};

/**
 * Deterministic candidate score. Same profile + same candidate => same score,
 * on this device and after restarts (no Math.random anywhere).
 */
export function scoreCandidate(
  candidate: { track: { id: string; artist: string }; source: string; artistKey: string; exploration: boolean; seedRank: number },
  context: ScoreContext,
): number {
  const { profile, now } = context;
  const trackStats = profile.trackStats.get(candidate.track.id);
  const artistStats = profile.artistStats.get(candidate.artistKey);

  let score = 0;
  if (artistStats) score += WEIGHTS.artistAffinity * (context.maxArtistAffinity > 0 ? artistAffinity(artistStats) / context.maxArtistAffinity : 0);
  if (trackStats) score += WEIGHTS.trackAffinity * (trackAffinity(trackStats) / WEIGHTS.maxTrackWeight);

  // Seed strength decays with seed rank, but only for radio-sourced candidates.
  if (candidate.source === 'radio' || candidate.source === 'likes-radio') {
    score += WEIGHTS.seedStrength * Math.pow(WEIGHTS.seedDecay, candidate.seedRank);
    const seedStats = profile.trackStats.get(candidate.track.id);
    score += WEIGHTS.recency * recencyFactor(seedStats?.lastPlayedAt ?? null, now);
  }

  // Recent search interest: candidate artist or source label matches a searched term.
  if (profile.searchTerms.some(entry => candidate.artistKey.includes(entry.term) || entry.term.includes(candidate.artistKey))) {
    score += WEIGHTS.searchInterest;
  }

  if (!trackStats && !artistStats && !profile.historyIds.has(candidate.track.id)) score += WEIGHTS.freshness;
  if (candidate.exploration) score += WEIGHTS.explorationBonus;

  // Stable per-track tie-break so equal candidates keep a consistent order.
  score += deterministicJitter(`${candidate.track.id}:${profile.version}`, WEIGHTS.jitter);
  return score;
}
