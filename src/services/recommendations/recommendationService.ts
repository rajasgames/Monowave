import type { Track } from "../../music";
import { TTL, getCached, initArtistIds, initCache, putCached } from "./cache";
import {
  applyDiversity,
  applyExplorationQuota,
  interleavePools,
} from "./diversity";
import {
  artistCandidates,
  likedRadioCandidates,
  radioCandidates,
  resolveArtistId,
  searchCandidates,
} from "./dataSources";
import { buildTasteProfile } from "./profile";
import { artistAffinity, scoreCandidate, WEIGHTS } from "./scoring";
import { getSignals, initSignals } from "./signals";
import type {
  Candidate,
  LibrarySnapshot,
  RecoResult,
  RecoSection,
  TasteProfile,
} from "./types";

/**
 * Section orchestrator. Turns (library, signals) into recommendation
 * sections. Rules enforced here:
 * - sections with insufficient real data are simply not emitted;
 * - every network step is isolated: one failing source never kills others;
 * - the Discover Mix is a real 20-30 track list that the UI plays as a queue;
 * - cold start never fabricates a "for you" section.
 */

/** Runs async jobs with bounded concurrency to keep the UI responsive. */
async function pool<T>(
  jobs: (() => Promise<T>)[],
  concurrency: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(jobs.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, jobs.length)) },
    async () => {
      while (cursor < jobs.length) {
        const index = cursor++;
        try {
          results[index] = { status: "fulfilled", value: await jobs[index]() };
        } catch (error) {
          results[index] = { status: "rejected", reason: error };
        }
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function scoreAll(candidates: Candidate[], profile: TasteProfile): Candidate[] {
  const maxArtistAffinity = profile.topArtists.length
    ? artistAffinity(profile.topArtists[0])
    : 0;
  const now = Date.now();
  return candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate, {
        profile,
        seedRank: candidate.seedRank,
        maxArtistAffinity,
        now,
      }),
    }))
    .sort((a, b) => b.score - a.score);
}

/** Ids to keep out of "new music" surfaces: the tail of recent listening. */
function recentHistoryIds(
  library: LibrarySnapshot,
  count: number,
): Set<string> {
  const ids = new Set<string>();
  for (const entry of library.history.slice(0, count)) {
    if (entry?.track?.id) ids.add(entry.track.id);
  }
  return ids;
}

function buildRecentlyPlayed(library: LibrarySnapshot): RecoSection | null {
  const tracks: Track[] = [];
  for (const entry of library.history) {
    const track = entry?.track;
    if (!track?.id) continue;
    if (tracks.some((existing) => existing.id === track.id)) continue; // dedupe repeated plays
    tracks.push(track);
    if (tracks.length >= WEIGHTS.sectionSize) break;
  }
  if (!tracks.length) return null;
  return {
    kind: "recently-played",
    title: "Recently played",
    subtitle: `${library.history.length} ${library.history.length === 1 ? "listen" : "listens"}`,
    tracks,
  };
}

function buildRediscover(
  profile: TasteProfile,
  library: LibrarySnapshot,
): RecoSection | null {
  // Liked or repeatedly played tracks that have not surfaced in the last 14 days.
  const cutoff = Date.now() - 14 * 86400000;
  const seen = new Set<string>();
  const picks: Track[] = [];
  const strong: Track[] = [...profile.likedTracks];
  for (const [id, stats] of profile.trackStats) {
    if (stats.plays > 1 && !stats.liked && !seen.has(id)) {
      const track = library.history.find(
        (entry) => entry.track.id === id,
      )?.track;
      if (track) strong.push(track);
    }
  }
  for (const track of strong) {
    if (seen.has(track.id)) continue;
    const stats = profile.trackStats.get(track.id);
    if ((stats?.lastPlayedAt ?? 0) > cutoff) continue;
    seen.add(track.id);
    picks.push(track);
    if (picks.length >= WEIGHTS.sectionSize) break;
  }
  if (!picks.length) return null;
  return {
    kind: "rediscover",
    title: "Rediscover",
    subtitle: "Strong picks you have not played lately",
    tracks: picks,
  };
}

/**
 * "Because you played X": radios of the strongest seeds, interleaved and
 * diversified. The section is attributed to the first seed that actually
 * returned data, never to one that failed.
 */
async function buildBecauseYouPlayed(
  profile: TasteProfile,
  exclude: Set<string>,
): Promise<{ section: RecoSection | null; pool: Candidate[] }> {
  const seeds = profile.seedTracks.slice(0, 2);
  if (!seeds.length) return { section: null, pool: [] };
  const settled = await Promise.allSettled(
    seeds.map(async (seed, rank) => ({
      seed,
      ranked: scoreAll(await radioCandidates(seed, profile, rank), profile),
    })),
  );
  const successful = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  if (!successful.length) return { section: null, pool: [] };
  const ranked = interleavePools(successful.map((entry) => entry.ranked));
  const seedIds = new Set(profile.seedTracks.map((track) => track.id));
  const diversified = applyDiversity(ranked, { excludeIds: exclude, seedIds });
  const picked = diversified.slice(0, WEIGHTS.sectionSize);
  if (!picked.length) return { section: null, pool: ranked };
  const seed = successful[0].seed;
  return {
    section: {
      kind: "because-you-played",
      title: `Because you played ${truncate(seed.title, 30)}`,
      subtitle: `Related to ${truncate(seed.artist, 44)}`,
      tracks: picked.map((candidate) => candidate.track),
      context: seed.title,
    },
    pool: diversified,
  };
}

/** "Based on your likes": merged radios of up to three (day-rotated) liked tracks. */
async function buildBasedOnLikes(
  profile: TasteProfile,
  exclude: Set<string>,
): Promise<{ section: RecoSection | null; pool: Candidate[] }> {
  if (!profile.likedTracks.length) return { section: null, pool: [] };
  const candidates = await likedRadioCandidates(profile);
  if (!candidates.length) return { section: null, pool: [] };
  const ranked = scoreAll(candidates, profile);
  const seedIds = new Set(profile.likedTracks.map((track) => track.id));
  const diversified = applyDiversity(ranked, { excludeIds: exclude, seedIds });
  const picked = diversified.slice(0, WEIGHTS.sectionSize);
  if (!picked.length) return { section: null, pool: ranked };
  const count = Math.min(3, profile.likedTracks.length);
  return {
    section: {
      kind: "based-on-likes",
      title: "Based on your likes",
      subtitle: `Grown from ${count} liked ${count === 1 ? "track" : "tracks"}`,
      tracks: picked.map((candidate) => candidate.track),
    },
    pool: diversified,
  };
}

/** "More from X": the top-affinity artist's own songs, resolved via channel page. */
async function buildMoreFromArtist(
  profile: TasteProfile,
  exclude: Set<string>,
): Promise<RecoSection | null> {
  const artist = profile.topArtists.find((entry) => artistAffinity(entry) > 0);
  if (!artist) return null;
  try {
    const browseId = await resolveArtistId(artist.name);
    if (!browseId) return null;
    const candidates = await artistCandidates(artist.name, browseId, profile);
    const ranked = scoreAll(candidates, profile);
    // The section is single-artist by design: lift the sliding window, keep the size cap.
    const diversified = applyDiversity(ranked, {
      excludeIds: exclude,
      maxPerArtist: WEIGHTS.sectionSize,
      windowMax: WEIGHTS.sectionSize,
    });
    const picked = diversified.slice(0, WEIGHTS.sectionSize);
    if (!picked.length) return null;
    return {
      kind: "more-from-artist",
      title: `More from ${truncate(artist.name, 30)}`,
      subtitle: "Songs from the artist you play most",
      tracks: picked.map((candidate) => candidate.track),
      context: artist.name,
    };
  } catch {
    return null; // artist page unavailable: section silently skipped, others unaffected
  }
}

/**
 * Discover Mix: aggregates every candidate pool (seed radios, liked radios,
 * because-you-played pool), scores, diversifies, enforces the exploration
 * share, and caches the result under the profile version so a restart
 * reproduces the same mix until the taste profile changes.
 */
async function buildDiscoverMix(
  profile: TasteProfile,
  library: LibrarySnapshot,
  pools: Candidate[][],
  ignoreMixCache: boolean,
): Promise<{ section: RecoSection | null; pool: Candidate[] }> {
  if (profile.strongSignalCount < WEIGHTS.coldStartStrongSignals)
    return { section: null, pool: [] };

  // Recent search terms contribute a small, taste-linked interest pool.
  const allPools: Candidate[][] = [...pools];
  for (const { term } of profile.searchTerms.slice(0, 2)) {
    try {
      allPools.push(scoreAll(await searchCandidates(term, profile), profile));
    } catch {
      /* search pool is optional */
    }
  }
  if (!allPools.length) return { section: null, pool: [] };

  const ranked = scoreAll(
    interleavePools(allPools.filter((list) => list.length)),
    profile,
  );
  const exclude = recentHistoryIds(library, 25);
  const seedIds = new Set<string>([
    ...profile.seedTracks.map((track) => track.id),
    ...profile.likedTracks.map((track) => track.id),
  ]);
  const diversified = applyDiversity(ranked, {
    excludeIds: exclude,
    seedIds,
    maxPerArtist: WEIGHTS.mixPerArtist,
  });
  if (diversified.length < WEIGHTS.mixAbsoluteMin)
    return { section: null, pool: diversified };

  const cacheKey = `mix:${profile.version}`;
  const cachedMix = ignoreMixCache
    ? null
    : getCached<string[]>(cacheKey, TTL.mix);
  let mixTracks: Track[] = [];
  const byId = new Map(
    diversified.map((candidate) => [candidate.track.id, candidate]),
  );
  if (cachedMix?.length) {
    mixTracks = cachedMix
      .map((id) => byId.get(id)?.track)
      .filter((track): track is Track => Boolean(track));
  }
  if (mixTracks.length < WEIGHTS.mixAbsoluteMin) {
    const targetSize = Math.min(
      WEIGHTS.mixMax,
      Math.max(WEIGHTS.mixMin, Math.round(diversified.length * 0.85)),
    );
    const { picked } = applyExplorationQuota(diversified, targetSize);
    mixTracks = picked.map((candidate) => candidate.track);
    if (mixTracks.length >= WEIGHTS.mixAbsoluteMin)
      putCached(
        cacheKey,
        mixTracks.map((track) => track.id),
        WEIGHTS.mixMax,
      );
  }
  if (mixTracks.length < WEIGHTS.mixAbsoluteMin) {
    // Cannot assemble an honest, taste-majority mix of sufficient size yet.
    return { section: null, pool: diversified };
  }

  const explorationCount = mixTracks.filter(
    (track) => byId.get(track.id)?.exploration,
  ).length;
  return {
    section: {
      kind: "discover-mix",
      title: "Discover Mix",
      subtitle: `${mixTracks.length} tracks · mixed from what you actually play`,
      tracks: mixTracks,
      context: explorationCount
        ? `${explorationCount} newer picks included`
        : undefined,
    },
    pool: diversified,
  };
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export type GenerateOptions = {
  /** Manual refresh: rebuild the mix even if a cached one exists. */
  ignoreMixCache?: boolean;
};

/** Main entry: build all sections for the current library + signals state. */
export async function generateRecommendations(
  library: LibrarySnapshot,
  options: GenerateOptions = {},
): Promise<RecoResult> {
  await Promise.all([initSignals(), initCache(), initArtistIds()]);
  const signals = getSignals();
  const profile = buildTasteProfile(library, signals);
  const notes: string[] = [];

  if (!library.history.length && !library.liked.length && !signals.length) {
    return {
      status: "cold",
      sections: [],
      notes: [
        "Cold start: nothing listened to yet. Play, finish, or like a few tracks to build real recommendations.",
      ],
      builtAt: Date.now(),
    };
  }

  // Local sections first (no network, cannot fail).
  const local: RecoSection[] = [];
  const recent = buildRecentlyPlayed(library);
  if (recent) local.push(recent);
  const rediscover = buildRediscover(profile, library);
  if (rediscover) local.push(rediscover);

  // "Because you played" pool doubles as a seed pool for the mix.
  const exclude = recentHistoryIds(library, 25);
  const because = await buildBecauseYouPlayed(profile, exclude);
  if (!because.section && profile.seedTracks.length) {
    notes.push("Because-you-played skipped: no related data returned.");
  }

  const likes = await buildBasedOnLikes(profile, exclude);
  if (!likes.section && profile.likedTracks.length) {
    notes.push("Based-on-likes skipped: no related data returned.");
  }

  const moreFrom = await buildMoreFromArtist(profile, exclude);

  const seedPools: Candidate[][] = [];
  const settledRadios = await pool(
    profile.seedTracks
      .slice(0, 4)
      .map((seed, rank) => () => radioCandidates(seed, profile, rank)),
    2,
  );
  settledRadios.forEach((result, index) => {
    if (result.status === "fulfilled") seedPools.push(result.value);
    else
      notes.push(
        `Radio for seed "${profile.seedTracks[index]?.title ?? "?"}" failed: ${String(result.reason).slice(0, 120)}`,
      );
  });

  // Artist pages of the strongest known artists enrich the mix with real
  // known-taste candidates (their own songs), keeping the mix large enough
  // while radios mostly contribute exploration candidates. Four pages give
  // margin against individual live lookup failures.
  const artistPools: Candidate[][] = [];
  const settledArtists = await pool(
    profile.topArtists.slice(0, 4).map((artist) => async () => {
      const browseId = await resolveArtistId(artist.name);
      if (!browseId) throw new Error(`no artist page for ${artist.name}`);
      return artistCandidates(artist.name, browseId, profile);
    }),
    2,
  );
  settledArtists.forEach((result) => {
    if (result.status === "fulfilled") artistPools.push(result.value);
  });

  const mix = await buildDiscoverMix(
    profile,
    library,
    [
      ...seedPools,
      ...artistPools,
      ...(because.pool.length ? [because.pool] : []),
      ...(likes.pool.length ? [likes.pool] : []),
    ],
    Boolean(options.ignoreMixCache),
  );
  if (
    !mix.section &&
    profile.strongSignalCount < WEIGHTS.coldStartStrongSignals
  ) {
    notes.push(
      `Discover Mix waits for ${WEIGHTS.coldStartStrongSignals} strong signals (likes + full listens + repeats); currently ${profile.strongSignalCount}.`,
    );
  } else if (!mix.section && mix.pool.length) {
    notes.push(
      "Discover Mix skipped: not enough distinct real candidates right now.",
    );
  }

  // Fixed presentation order; every slot optional.
  const byKind = new Map<RecoSection["kind"], RecoSection>();
  for (const section of [
    mix.section,
    because.section,
    moreFrom,
    likes.section,
    ...local,
  ]) {
    if (section) byKind.set(section.kind, section);
  }
  const ordered: RecoSection[] = [
    byKind.get("discover-mix"),
    byKind.get("recently-played"),
    byKind.get("because-you-played"),
    byKind.get("more-from-artist"),
    byKind.get("based-on-likes"),
    byKind.get("rediscover"),
  ].filter((section): section is RecoSection => Boolean(section));

  if (!ordered.length)
    notes.push("No section had enough real data to display yet.");
  const status: RecoResult["status"] = mix.section ? "ready" : "partial";
  return { status, sections: ordered, notes, builtAt: Date.now() };
}
