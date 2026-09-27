import { useState, useCallback, useRef, useEffect } from "react";
import { Track } from "../core/types";
import { RepeatMode, QueueState } from "../playback/types";
import {
  createInitialQueue,
  getNextIndex as calcNextIndex,
  getPreviousIndex as calcPrevIndex,
  enqueue as calcEnqueue,
  playNext as calcPlayNext,
  removeFromQueue as calcRemoveFromQueue,
  reorderQueue as calcReorderQueue,
  toggleShuffle as calcToggleShuffle,
  cycleRepeatMode as calcCycleRepeatMode,
} from "../playback/queue";

export function useQueueController(
  initialTracks: Track[] = [],
  initialIndex = 0,
) {
  const [queueState, setQueueState] = useState<QueueState>(() =>
    createInitialQueue(initialTracks, initialIndex),
  );
  const queueRef = useRef(queueState);
  useEffect(() => {
    queueRef.current = queueState;
  }, [queueState]);

  const setQueue = useCallback((tracks: Track[], index = 0) => {
    setQueueState((prev) => {
      const next = createInitialQueue(
        tracks,
        index,
        prev.isShuffled,
        prev.repeatMode,
      );
      queueRef.current = next;
      return next;
    });
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    setQueueState((prev) => {
      if (index < 0 || index >= prev.items.length) return prev;
      const next = { ...prev, currentIndex: index };
      queueRef.current = next;
      return next;
    });
  }, []);

  const addNext = useCallback((track: Track) => {
    setQueueState((prev) => {
      const next = calcPlayNext(prev, track);
      queueRef.current = next;
      return next;
    });
  }, []);

  const enqueue = useCallback((track: Track) => {
    setQueueState((prev) => {
      const next = calcEnqueue(prev, track);
      queueRef.current = next;
      return next;
    });
  }, []);

  const removeQueued = useCallback((at: number) => {
    setQueueState((prev) => {
      const next = calcRemoveFromQueue(prev, at);
      queueRef.current = next;
      return next;
    });
  }, []);

  const moveQueued = useCallback((from: number, to: number) => {
    setQueueState((prev) => {
      const next = calcReorderQueue(prev, from, to);
      queueRef.current = next;
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueueState((prev) => {
      const next = createInitialQueue([], 0, false, prev.repeatMode);
      queueRef.current = next;
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setQueueState((prev) => {
      const next = calcToggleShuffle(prev);
      queueRef.current = next;
      return next;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setQueueState((prev) => {
      const next = {
        ...prev,
        repeatMode: calcCycleRepeatMode(prev.repeatMode),
      };
      queueRef.current = next;
      return next;
    });
  }, []);

  const getNextTrackIndex = useCallback((): number | null => {
    return calcNextIndex(queueRef.current);
  }, []);

  const getPreviousTrackIndex = useCallback((): number | null => {
    return calcPrevIndex(queueRef.current);
  }, []);

  const currentTrack =
    queueState.items.length > 0 &&
    queueState.currentIndex < queueState.items.length
      ? queueState.items[queueState.currentIndex]
      : null;

  return {
    queue: queueState.items,
    index: queueState.currentIndex,
    currentTrack,
    shuffle: queueState.isShuffled,
    repeat: queueState.repeatMode as "off" | "all" | "one",
    setQueue,
    setCurrentIndex,
    addNext,
    enqueue,
    removeQueued,
    moveQueued,
    clearQueue,
    toggleShuffle,
    cycleRepeat,
    getNextTrackIndex,
    getPreviousTrackIndex,
  };
}

export type QueueController = ReturnType<typeof useQueueController>;
