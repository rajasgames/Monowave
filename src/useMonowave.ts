import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import { resolveAudio } from "../modules/stream-extractor";
import {
  recordComplete,
  recordPlaylistAdd,
  recordSkip,
} from "./services/recommendations";
import type { Track } from "./music";

export type SavedPlaylist = { id: string; name: string; tracks: Track[] };
export type Listen = { track: Track; playedAt: number };
type Repeat = "off" | "all" | "one";
type Store = {
  queue: Track[];
  index: number;
  liked: Track[];
  playlists: SavedPlaylist[];
  history: Listen[];
  repeat: Repeat;
  shuffle: boolean;
  name: string;
};
const INITIAL: Store = {
  queue: [],
  index: -1,
  liked: [],
  playlists: [],
  history: [],
  repeat: "off",
  shuffle: false,
  name: "",
};
const STORAGE_KEY = "monowave:library:v1";

export function useMonowave() {
  const [data, setData] = useState<Store>(INITIAL);
  const dataRef = useRef(data);
  useLayoutEffect(() => {
    dataRef.current = data;
  }, [data]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const player = useMemo<AudioPlayer>(
    () => createAudioPlayer(null, { updateInterval: 500 }),
    [],
  );
  const loadNumber = useRef(0);
  const loadedId = useRef<string | null>(null);
  const completing = useRef(false);
  const nextRef = useRef<() => void>(() => {});
  /** Id of the track that auto-advanced on completion, so manual skips are distinguishable. */
  const autoAdvanced = useRef<string | null>(null);

  /** Emits a skip signal for the outgoing track (unless it just finished naturally). */
  const signalOutgoingSkip = useCallback(() => {
    const state = dataRef.current;
    const track = state.queue[state.index];
    if (!track || loadedId.current !== track.id) return;
    if (autoAdvanced.current === track.id) return; // finished naturally: not a skip
    const fraction = duration > 0 ? position / duration : 0;
    recordSkip(track, fraction);
  }, [position, duration]);

  const update = useCallback(
    (edit: (previous: Store) => Store) =>
      setData((old) => {
        const newer = edit(old);
        dataRef.current = newer;
        return newer;
      }),
    [],
  );

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw && active) {
          const saved = JSON.parse(raw) as Partial<Store>;
          update(() => ({
            ...INITIAL,
            ...saved,
            queue: saved.queue ?? [],
            playlists: saved.playlists ?? [],
          }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [update]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [data, ready]);

  useEffect(() => {
    const subscription = player.addListener(
      "playbackStatusUpdate",
      (status) => {
        setPlaying(Boolean(status.playing));
        setPosition(status.currentTime || 0);
        setDuration(status.duration || 0);
        if (status.error) setMessage(String(status.error));
        if (status.didJustFinish && !completing.current) {
          completing.current = true;
          if (dataRef.current.repeat === "one") {
            const track = dataRef.current.queue[dataRef.current.index];
            if (track && loadedId.current === track.id) {
              autoAdvanced.current = track.id;
              recordComplete(track); // each full loop is a real complete listen
            }
            void player
              .seekTo(0)
              .then(() => player.play())
              .finally(() => {
                completing.current = false;
              });
          } else {
            const finished = dataRef.current.queue[dataRef.current.index];
            if (finished && loadedId.current === finished.id) {
              autoAdvanced.current = finished.id; // marks it complete: next() must not record a skip
              recordComplete(finished);
            }
            nextRef.current();
          }
        }
      },
    );
    return () => {
      subscription.remove();
      player.remove();
    };
  }, [player]);

  const playAt = useCallback(
    async (tracks: Track[], index: number) => {
      const track = tracks[index];
      if (!track) return;
      player.pause(); // Pause immediately to prevent audio overlaps during resolution
      const request = ++loadNumber.current;
      completing.current = false;
      setBusy(true);
      setMessage("");
      update((previous) => ({ ...previous, queue: tracks, index }));
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "doNotMix",
        });
        const stream = await resolveAudio(track.id);
        if (!stream.ok) throw new Error(stream.message);
        if (request !== loadNumber.current) return;
        player.replace({
          uri: stream.url,
          headers: { "User-Agent": stream.userAgent },
        });
        loadedId.current = track.id;
        player.play();
        player.setActiveForLockScreen(
          true,
          { title: track.title, artist: track.artist, artworkUrl: track.cover },
          { showSeekBackward: true, showSeekForward: true },
        );
        autoAdvanced.current = null;
        update((previous) => ({
          ...previous,
          history: [{ track, playedAt: Date.now() }, ...previous.history].slice(
            0,
            300,
          ),
        }));
      } catch (error) {
        if (request === loadNumber.current)
          setMessage(error instanceof Error ? error.message : String(error));
      } finally {
        if (request === loadNumber.current) setBusy(false);
      }
    },
    [player, update],
  );

  const playTrack = useCallback(
    (track: Track, collection?: Track[]) => {
      const tracks = collection?.length ? collection : [track];
      void playAt(
        tracks,
        Math.max(
          0,
          tracks.findIndex((item) => item.id === track.id),
        ),
      );
    },
    [playAt],
  );

  const next = useCallback(() => {
    const current = dataRef.current;
    if (!current.queue.length) return;
    const outgoing = current.queue[current.index];
    if (outgoing && autoAdvanced.current !== outgoing.id) signalOutgoingSkip();
    let index = current.shuffle
      ? Math.floor(Math.random() * current.queue.length)
      : current.index + 1;
    if (index >= current.queue.length) {
      if (current.repeat !== "all") {
        player.pause();
        return;
      }
      index = 0;
    }
    void playAt(current.queue, index);
  }, [playAt, player, signalOutgoingSkip]);
  useLayoutEffect(() => {
    nextRef.current = next;
  }, [next]);

  const previous = useCallback(() => {
    const current = dataRef.current;
    if (position > 3) {
      const outgoing = current.queue[current.index];
      if (outgoing && autoAdvanced.current !== outgoing.id)
        signalOutgoingSkip();
      void player.seekTo(0);
      return;
    }
    void playAt(current.queue, Math.max(0, current.index - 1));
  }, [playAt, player, position, signalOutgoingSkip]);

  const toggle = useCallback(() => {
    const state = dataRef.current;
    const track = state.queue[state.index];
    if (track && loadedId.current !== track.id) {
      void playAt(state.queue, state.index);
      return;
    }
    if (playing) player.pause();
    else player.play();
  }, [player, playing, playAt]);
  const seek = useCallback(
    (at: number) => {
      void player.seekTo(Math.max(0, Math.min(duration, at)));
    },
    [player, duration],
  );
  const like = useCallback(
    (track: Track) =>
      update((old) => ({
        ...old,
        liked: old.liked.some((item) => item.id === track.id)
          ? old.liked.filter((item) => item.id !== track.id)
          : [track, ...old.liked],
      })),
    [update],
  );
  const addNext = useCallback(
    (track: Track) =>
      update((old) => {
        const queue = [...old.queue];
        queue.splice(old.index + 1, 0, track);
        return { ...old, queue };
      }),
    [update],
  );
  const enqueue = useCallback(
    (track: Track) =>
      update((old) => ({ ...old, queue: [...old.queue, track] })),
    [update],
  );
  const removeQueued = useCallback(
    (at: number) =>
      update((old) => {
        if (at === old.index) return old;
        return {
          ...old,
          queue: old.queue.filter((_, index) => index !== at),
          index: at < old.index ? old.index - 1 : old.index,
        };
      }),
    [update],
  );
  const moveQueued = useCallback(
    (from: number, to: number) =>
      update((old) => {
        if (
          to < 0 ||
          to >= old.queue.length ||
          from <= old.index ||
          to <= old.index
        )
          return old;
        const queue = [...old.queue];
        const [item] = queue.splice(from, 1);
        queue.splice(to, 0, item);
        return { ...old, queue };
      }),
    [update],
  );
  const cycleRepeat = useCallback(
    () =>
      update((old) => ({
        ...old,
        repeat:
          old.repeat === "off" ? "all" : old.repeat === "all" ? "one" : "off",
      })),
    [update],
  );
  const toggleShuffle = useCallback(
    () => update((old) => ({ ...old, shuffle: !old.shuffle })),
    [update],
  );
  const createPlaylist = useCallback(
    (name: string, tracks: Track[] = []) =>
      update((old) => ({
        ...old,
        playlists: [
          ...old.playlists,
          { id: String(Date.now()), name: name.trim(), tracks },
        ],
      })),
    [update],
  );
  const deletePlaylist = useCallback(
    (id: string) =>
      update((old) => ({
        ...old,
        playlists: old.playlists.filter((list) => list.id !== id),
      })),
    [update],
  );
  const addToPlaylist = useCallback(
    (id: string, track: Track) => {
      recordPlaylistAdd(track);
      update((old) => ({
        ...old,
        playlists: old.playlists.map((list) =>
          list.id === id && !list.tracks.some((item) => item.id === track.id)
            ? { ...list, tracks: [...list.tracks, track] }
            : list,
        ),
      }));
    },
    [update],
  );
  const removeFromPlaylist = useCallback(
    (id: string, trackId: string) =>
      update((old) => ({
        ...old,
        playlists: old.playlists.map((list) =>
          list.id === id
            ? {
                ...list,
                tracks: list.tracks.filter((item) => item.id !== trackId),
              }
            : list,
        ),
      })),
    [update],
  );
  const setName = useCallback(
    (name: string) => update((old) => ({ ...old, name })),
    [update],
  );
  const clearHistory = useCallback(
    () => update((old) => ({ ...old, history: [] })),
    [update],
  );
  const current = data.queue[data.index] ?? null;

  return {
    data,
    current,
    ready,
    busy,
    message,
    playing,
    position,
    duration,
    player,
    playTrack,
    playAt,
    next,
    previous,
    toggle,
    seek,
    like,
    addNext,
    enqueue,
    removeQueued,
    moveQueued,
    cycleRepeat,
    toggleShuffle,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    setName,
    clearHistory,
  };
}
