import { useCallback, useEffect, useRef, useState } from 'react';
import { bindRecoStorageToAsyncStorage } from './services/recommendations/asyncStorageKV';
import { generateRecommendations, subscribeSignals } from './services/recommendations';
import type { RecoResult } from './services/recommendations';
import type { useMonowave } from './useMonowave';

type UseMonowaveReturn = ReturnType<typeof useMonowave>;

export type RecoState = {
  result: RecoResult | null;
  refreshing: boolean;
  error: string | null;
};

/**
 * Owns recommendation generation for the UI:
 * - binds the engine's storage to AsyncStorage once,
 * - regenerates (debounced) when the listening inputs change,
 * - never blocks the UI: state updates land after async work completes,
 * - exposes a manual refresh that bypasses the mix cache.
 */
export function useRecommendations(app: UseMonowaveReturn) {
  const { data, ready } = app;
  const [state, setState] = useState<RecoState>({ result: null, refreshing: false, error: null });
  const [signalRevision, setSignalRevision] = useState(0);
  const dataRef = useRef(data);
  dataRef.current = data;
  const running = useRef(false);
  const pendingRun = useRef(false);
  const pendingManual = useRef(false);
  const bound = useRef(false);

  // Track actual taste inputs rather than only array lengths. This catches
  // same-length mutations (a replaced like, rotated capped history, playlist edits).
  // Queue/position/duration stay excluded because they are transient playback state.
  const inputsKey = JSON.stringify([
    ready,
    signalRevision,
    data.history.map(entry => [entry.track.id, entry.playedAt]),
    data.liked.map(track => track.id),
    data.playlists.map(list => [list.id, list.tracks.map(track => track.id)]),
  ]);

  const regenerate = useCallback(async (manual: boolean) => {
    if (!ready) return;
    if (running.current) {
      pendingRun.current = true;
      pendingManual.current = pendingManual.current || manual;
      return;
    }
    running.current = true;
    if (manual) setState(previous => ({ ...previous, refreshing: true }));
    try {
      const snapshot = dataRef.current;
      const result = await generateRecommendations(
        { history: snapshot.history, liked: snapshot.liked, playlists: snapshot.playlists },
        { ignoreMixCache: manual },
      );
      setState({ result, refreshing: false, error: null });
    } catch (error) {
      // Generation itself never throws per-section; a throw here is a bug or
      // storage failure. Keep previous sections, surface an honest note.
      setState(previous => ({
        result: previous.result,
        refreshing: false,
        error: `Recommendations could not update: ${error instanceof Error ? error.message : String(error)}`,
      }));
    } finally {
      running.current = false;
      if (pendingRun.current) {
        const manualPending = pendingManual.current;
        pendingRun.current = false;
        pendingManual.current = false;
        void regenerate(manualPending);
      }
    }
  }, [ready]);

  useEffect(() => {
    if (!bound.current) {
      bound.current = true;
      bindRecoStorageToAsyncStorage();
    }
  }, []);

  useEffect(() => subscribeSignals(() => {
    setSignalRevision(revision => revision + 1);
  }), []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => { void regenerate(false); }, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputsKey, ready]);

  const refresh = useCallback(() => { void regenerate(true); }, [regenerate]);

  return { reco: state.result, refreshing: state.refreshing, error: state.error, refresh };
}
