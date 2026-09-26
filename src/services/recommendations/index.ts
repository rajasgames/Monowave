/**
 * Recommendation engine public surface.
 * NOTE: asyncStorageKV.ts is intentionally not re-exported here so the
 * engine stays free of React Native imports (Node-testable). The app binds
 * storage in src/useRecommendations.ts via bindRecoStorageToAsyncStorage().
 */
export { initSignals, getSignals, subscribeSignals, recordComplete, recordSkip, recordSearch, recordPlaylistAdd } from './signals';
export { initCache, getCached, putCached, clearCache, TTL } from './cache';
export { buildTasteProfile } from './profile';
export { scoreCandidate, artistAffinity, trackAffinity, artistKey, WEIGHTS } from './scoring';
export { applyDiversity, applyExplorationQuota, interleavePools } from './diversity';
export { generateRecommendations } from './recommendationService';
export type {
  ArtistStats, BehaviorEvent, Candidate, LibrarySnapshot, RecoResult, RecoSection,
  SectionKind, SignalType, TasteProfile, TrackStats,
} from './types';
