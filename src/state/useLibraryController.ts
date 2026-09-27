import { useState, useEffect, useCallback, useRef } from "react";
import { Track, Playlist, HistoryEntry } from "../core/types";
import {
  LibraryRepository,
  defaultLibraryRepository,
} from "../storage/libraryRepository";
import { LibraryData, INITIAL_LIBRARY_DATA } from "../storage/schemas";
import { recordPlaylistAdd } from "../services/recommendations";

export function useLibraryController(
  repo: LibraryRepository = defaultLibraryRepository,
) {
  const [data, setData] = useState<LibraryData>(INITIAL_LIBRARY_DATA);
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let active = true;
    repo.load().then((loaded) => {
      if (active) {
        setData(loaded);
        dataRef.current = loaded;
        setReady(true);
      }
    });

    const unsubscribe = repo.subscribe((updated) => {
      if (active) {
        setData(updated);
        dataRef.current = updated;
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [repo]);

  const update = useCallback(
    (updater: (prev: LibraryData) => LibraryData) => {
      const next = updater(dataRef.current);
      setData(next);
      dataRef.current = next;
      void repo.save(next);
    },
    [repo],
  );

  const like = useCallback(
    (track: Track) => {
      update((prev) => {
        const isLiked = prev.likedTracks.some(
          (t) =>
            t.id === track.id || (t.sourceId && t.sourceId === track.sourceId),
        );
        const updatedLiked = isLiked
          ? prev.likedTracks.filter(
              (t) =>
                t.id !== track.id &&
                (!track.sourceId || t.sourceId !== track.sourceId),
            )
          : [track, ...prev.likedTracks];
        return { ...prev, likedTracks: updatedLiked };
      });
    },
    [update],
  );

  const createPlaylist = useCallback(
    (name: string, tracks: Track[] = []) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const newPlaylist: Playlist = {
        id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: trimmed,
        tracks: [...tracks],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      update((prev) => ({
        ...prev,
        playlists: [newPlaylist, ...prev.playlists],
      }));
    },
    [update],
  );

  const renamePlaylist = useCallback(
    (id: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      update((prev) => ({
        ...prev,
        playlists: prev.playlists.map((pl) =>
          pl.id === id ? { ...pl, name: trimmed, updatedAt: Date.now() } : pl,
        ),
      }));
    },
    [update],
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        playlists: prev.playlists.filter((pl) => pl.id !== id),
      }));
    },
    [update],
  );

  const addToPlaylist = useCallback(
    (id: string, track: Track) => {
      recordPlaylistAdd(track);
      update((prev) => ({
        ...prev,
        playlists: prev.playlists.map((pl) => {
          if (pl.id !== id) return pl;
          if (pl.tracks.some((t) => t.id === track.id)) return pl;
          return {
            ...pl,
            tracks: [...pl.tracks, track],
            updatedAt: Date.now(),
          };
        }),
      }));
    },
    [update],
  );

  const removeFromPlaylist = useCallback(
    (id: string, trackId: string) => {
      update((prev) => ({
        ...prev,
        playlists: prev.playlists.map((pl) => {
          if (pl.id !== id) return pl;
          return {
            ...pl,
            tracks: pl.tracks.filter((t) => t.id !== trackId),
            updatedAt: Date.now(),
          };
        }),
      }));
    },
    [update],
  );

  const reorderPlaylist = useCallback(
    (id: string, from: number, to: number) => {
      update((prev) => ({
        ...prev,
        playlists: prev.playlists.map((pl) => {
          if (pl.id !== id) return pl;
          if (
            from < 0 ||
            from >= pl.tracks.length ||
            to < 0 ||
            to >= pl.tracks.length
          )
            return pl;
          const newTracks = [...pl.tracks];
          const [removed] = newTracks.splice(from, 1);
          newTracks.splice(to, 0, removed);
          return { ...pl, tracks: newTracks, updatedAt: Date.now() };
        }),
      }));
    },
    [update],
  );

  const addHistoryEntry = useCallback(
    (track: Track, completed = false, listenedSeconds?: number) => {
      const entry: HistoryEntry = {
        id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        track,
        startedAt: Date.now(),
        completed,
        listenedSeconds,
      };
      update((prev) => ({
        ...prev,
        history: [entry, ...prev.history].slice(0, 300),
      }));
    },
    [update],
  );

  const clearHistory = useCallback(() => {
    update((prev) => ({
      ...prev,
      history: [],
    }));
  }, [update]);

  const setProfileName = useCallback(
    (name: string) => {
      update((prev) => ({
        ...prev,
        profileName: name,
      }));
    },
    [update],
  );

  const clearAll = useCallback(async () => {
    await repo.clear();
    setData(INITIAL_LIBRARY_DATA);
    dataRef.current = INITIAL_LIBRARY_DATA;
  }, [repo]);

  // Backward-compatible projections for existing screens
  const liked = data.likedTracks;
  const playlists = data.playlists;
  const history = data.history.map((h) => ({
    track: h.track,
    playedAt: h.startedAt,
  }));
  const name = data.profileName;

  return {
    ready,
    data: {
      liked,
      playlists,
      history,
      name,
    },
    likedTracks: data.likedTracks,
    playlists: data.playlists,
    history: data.history,
    profileName: data.profileName,
    like,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylist,
    addHistoryEntry,
    clearHistory,
    setProfileName,
    clearAll,
  };
}

export type LibraryController = ReturnType<typeof useLibraryController>;
