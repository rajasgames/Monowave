import { useState, useEffect, useCallback, useRef } from "react";
import { Track } from "../core/types";
import {
  PlaybackEngine,
  defaultPlaybackEngine,
} from "../playback/PlaybackEngine";
import { PlaybackSnapshot } from "../playback/types";
import { QueueController } from "./useQueueController";
import { LibraryController } from "./useLibraryController";
import { recordComplete, recordSkip } from "../services/recommendations";

export function usePlaybackController(
  queueController: QueueController,
  libraryController: LibraryController,
  engine: PlaybackEngine = defaultPlaybackEngine,
) {
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>(() =>
    engine.getSnapshot(),
  );
  const queueRef = useRef(queueController);
  const libraryRef = useRef(libraryController);
  useEffect(() => {
    queueRef.current = queueController;
    libraryRef.current = libraryController;
  }, [queueController, libraryController]);

  useEffect(() => {
    const unsubState = engine.onStateChange((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    const unsubComplete = engine.onTrackComplete((track) => {
      const q = queueRef.current;
      const lib = libraryRef.current;
      lib.addHistoryEntry(
        track,
        true,
        track.durationSeconds ?? track.duration ?? 0,
      );
      recordComplete(track);

      if (q.repeat === "one") {
        void engine.seek(0).then(() => engine.resume());
        return;
      }

      const nextIndex = q.getNextTrackIndex();
      if (nextIndex !== null && q.queue[nextIndex]) {
        q.setCurrentIndex(nextIndex);
        void engine.play(q.queue[nextIndex]);
      } else {
        engine.pause();
      }
    });

    const unsubSkip = engine.onTrackSkip((track, fraction) => {
      recordSkip(track, fraction);
    });

    return () => {
      unsubState();
      unsubComplete();
      unsubSkip();
    };
  }, [engine]);

  const playAt = useCallback(
    async (tracks: Track[], index: number) => {
      if (tracks.length === 0 || index < 0 || index >= tracks.length) return;
      queueRef.current.setQueue(tracks, index);
      const target = tracks[index];
      await engine.play(target);
    },
    [engine],
  );

  const playTrack = useCallback(
    (track: Track, collection?: Track[]) => {
      const list = collection && collection.length > 0 ? collection : [track];
      const targetIndex = Math.max(
        0,
        list.findIndex(
          (t) =>
            t.id === track.id || (t.sourceId && t.sourceId === track.sourceId),
        ),
      );
      void playAt(list, targetIndex >= 0 ? targetIndex : 0);
    },
    [playAt],
  );

  const next = useCallback(() => {
    const q = queueRef.current;
    if (q.queue.length === 0) return;
    const nextIndex = q.getNextTrackIndex();
    if (nextIndex !== null && q.queue[nextIndex]) {
      q.setCurrentIndex(nextIndex);
      void engine.play(q.queue[nextIndex]);
    } else {
      engine.pause();
    }
  }, [engine]);

  const previous = useCallback(() => {
    const currentPos = engine.getSnapshot().positionSeconds;
    if (currentPos > 3) {
      void engine.seek(0);
      return;
    }
    const q = queueRef.current;
    if (q.queue.length === 0) return;
    const prevIndex = q.getPreviousTrackIndex();
    if (prevIndex !== null && q.queue[prevIndex]) {
      q.setCurrentIndex(prevIndex);
      void engine.play(q.queue[prevIndex]);
    } else {
      void engine.seek(0);
    }
  }, [engine]);

  const toggle = useCallback(() => {
    const s = engine.getSnapshot();
    if (s.status === "playing") {
      engine.pause();
    } else if (s.status === "paused" || s.status === "idle") {
      if (s.currentTrack) {
        engine.resume();
      } else if (queueRef.current.currentTrack) {
        void engine.play(queueRef.current.currentTrack);
      }
    }
  }, [engine]);

  const seek = useCallback(
    (seconds: number) => {
      void engine.seek(seconds);
    },
    [engine],
  );

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      void engine.seekBy(deltaSeconds);
    },
    [engine],
  );

  const pause = useCallback(() => {
    engine.pause();
  }, [engine]);

  const resume = useCallback(() => {
    engine.resume();
  }, [engine]);

  const playing = snapshot.status === "playing";
  const busy = snapshot.status === "loading";
  const position = snapshot.positionSeconds;
  const duration =
    snapshot.durationSeconds ||
    snapshot.currentTrack?.durationSeconds ||
    snapshot.currentTrack?.duration ||
    0;
  const current = snapshot.currentTrack;
  const error = snapshot.error;
  const message = snapshot.error?.userMessage ?? "";

  return {
    status: snapshot.status,
    playing,
    busy,
    position,
    duration,
    current,
    error,
    message,
    playTrack,
    playAt,
    next,
    previous,
    toggle,
    pause,
    resume,
    seek,
    seekBy,
  };
}

export type PlaybackController = ReturnType<typeof usePlaybackController>;
