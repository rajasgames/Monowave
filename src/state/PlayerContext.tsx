import React, { createContext, useContext, useState, useMemo } from "react";
import { Track } from "../core/types";
import { useQueueController, QueueController } from "./useQueueController";
import {
  useLibraryController,
  LibraryController,
} from "./useLibraryController";
import {
  usePlaybackController,
  PlaybackController,
} from "./usePlaybackController";
import {
  usePreferencesController,
  PreferencesController,
} from "./usePreferencesController";
import {
  useRecommendations,
  RecoState as EngineRecoState,
} from "../useRecommendations";

// 1. Playback Context (frequently updating position/duration)
export const PlaybackContext = createContext<PlaybackController | null>(null);

// 2. Queue Context
export const QueueContext = createContext<QueueController | null>(null);

// 3. Library Context
export const LibraryContext = createContext<LibraryController | null>(null);

// 4. Preferences Context
export const PreferencesContext = createContext<PreferencesController | null>(
  null,
);

// 5. Action Track Modal Context
export type ActionTrackContextType = {
  actionTrack: Track | null;
  setActionTrack: (track: Track | null) => void;
};
export const ActionTrackContext = createContext<ActionTrackContextType | null>(
  null,
);

// 6. Recommendation Context
export type RecoContextType = {
  reco: EngineRecoState["result"];
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
};
export const RecoContext = createContext<RecoContextType | null>(null);

// Granular hooks for optimal rendering performance
export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("Missing PlaybackContext");
  return ctx;
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("Missing QueueContext");
  return ctx;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("Missing LibraryContext");
  return ctx;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("Missing PreferencesContext");
  return ctx;
}

export function useActionTrack() {
  const ctx = useContext(ActionTrackContext);
  if (!ctx) throw new Error("Missing ActionTrackContext");
  return ctx;
}

export function useRecos() {
  const ctx = useContext(RecoContext);
  if (!ctx) throw new Error("Missing RecoContext");
  return ctx;
}

// Composite hook for backward compatibility with existing screens
export function usePlayer() {
  const playback = usePlayback();
  const queue = useQueue();
  const library = useLibrary();
  const action = useActionTrack();

  return {
    // Playback state & controls
    status: playback.status,
    playing: playback.playing,
    busy: playback.busy,
    position: playback.position,
    duration: playback.duration,
    current: playback.current,
    error: playback.error,
    message: playback.message,
    playTrack: playback.playTrack,
    playAt: playback.playAt,
    next: playback.next,
    previous: playback.previous,
    toggle: playback.toggle,
    pause: playback.pause,
    resume: playback.resume,
    seek: playback.seek,
    seekBy: playback.seekBy,

    // Queue state & controls
    queue: queue.queue,
    index: queue.index,
    shuffle: queue.shuffle,
    repeat: queue.repeat,
    addNext: queue.addNext,
    enqueue: queue.enqueue,
    removeQueued: queue.removeQueued,
    moveQueued: queue.moveQueued,
    clearQueue: queue.clearQueue,
    toggleShuffle: queue.toggleShuffle,
    cycleRepeat: queue.cycleRepeat,

    ready: library.ready,
    data: {
      ...library.data,
      queue: queue.queue,
      index: queue.index,
      shuffle: queue.shuffle,
      repeat: queue.repeat,
    },
    like: library.like,
    createPlaylist: library.createPlaylist,
    renamePlaylist: library.renamePlaylist,
    deletePlaylist: library.deletePlaylist,
    addToPlaylist: library.addToPlaylist,
    removeFromPlaylist: library.removeFromPlaylist,
    reorderPlaylist: library.reorderPlaylist,
    clearHistory: library.clearHistory,
    setName: library.setProfileName,

    // Action sheet track
    actionTrack: action.actionTrack,
    setActionTrack: action.setActionTrack,
  };
}

export function StateProvider({ children }: { children: React.ReactNode }) {
  const library = useLibraryController();
  const queue = useQueueController();
  const playback = usePlaybackController(queue, library);
  const preferences = usePreferencesController();
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  // Recommendations input adapter
  const recoAdapter = useMemo(
    () => ({
      data: {
        queue: queue.queue,
        index: queue.index,
        liked: library.data.liked,
        playlists: library.data.playlists,
        history: library.data.history,
        repeat: queue.repeat,
        shuffle: queue.shuffle,
        name: library.data.name,
      },
      ready: library.ready,
    }),
    [
      queue.queue,
      queue.index,
      queue.repeat,
      queue.shuffle,
      library.data,
      library.ready,
    ],
  );

  const recos = useRecommendations(recoAdapter as any);

  const actionValue = useMemo(
    () => ({ actionTrack, setActionTrack }),
    [actionTrack],
  );

  return (
    <LibraryContext.Provider value={library}>
      <QueueContext.Provider value={queue}>
        <PreferencesContext.Provider value={preferences}>
          <PlaybackContext.Provider value={playback}>
            <ActionTrackContext.Provider value={actionValue}>
              <RecoContext.Provider value={recos}>
                {children}
              </RecoContext.Provider>
            </ActionTrackContext.Provider>
          </PlaybackContext.Provider>
        </PreferencesContext.Provider>
      </QueueContext.Provider>
    </LibraryContext.Provider>
  );
}
