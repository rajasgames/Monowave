import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { Track } from "../core/types";
import { AppError, createAppError, isAppError } from "../core/errors";
import {
  StreamResolver,
  defaultStreamResolver,
} from "../providers/stream/StreamResolver";
import { PlaybackSnapshot, PlayerStatus } from "./types";

export type PlaybackListener = (snapshot: PlaybackSnapshot) => void;
export type CompletionListener = (track: Track) => void;
export type SkipListener = (track: Track, fractionListened: number) => void;

export class PlaybackEngine {
  private readonly resolver: StreamResolver;
  private player: AudioPlayer | null = null;
  private audioModeConfigured = false;

  private currentTrack: Track | null = null;
  private status: PlayerStatus = "idle";
  private positionSeconds = 0;
  private durationSeconds = 0;
  private bufferedSeconds = 0;
  private currentError: AppError | null = null;

  // Race condition token guard
  private loadGeneration = 0;
  private currentAbortController: AbortController | null = null;

  // Track completion / skip state
  private loadedTrackId: string | null = null;
  private naturalFinishTrackId: string | null = null;
  private isCompleting = false;

  private readonly stateListeners = new Set<PlaybackListener>();
  private readonly completeListeners = new Set<CompletionListener>();
  private readonly skipListeners = new Set<SkipListener>();

  constructor(resolver: StreamResolver = defaultStreamResolver) {
    this.resolver = resolver;
  }

  private async ensurePlayer(): Promise<AudioPlayer> {
    if (!this.player) {
      this.player = createAudioPlayer(null, { updateInterval: 500 });
      this.player.addListener("playbackStatusUpdate", (update: any) => {
        this.handleStatusUpdate(update);
      });
    }

    if (!this.audioModeConfigured) {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "doNotMix",
        });
        this.audioModeConfigured = true;
      } catch {
        // Fallback for non-native / test environments
      }
    }

    return this.player;
  }

  private handleStatusUpdate(update: any) {
    if (update.playing !== undefined) {
      if (update.playing && this.status !== "playing") {
        this.status = "playing";
      } else if (!update.playing && this.status === "playing") {
        this.status = "paused";
      }
    }

    if (typeof update.currentTime === "number") {
      this.positionSeconds = update.currentTime;
    }
    if (typeof update.duration === "number") {
      this.durationSeconds = update.duration;
    }
    if (typeof update.buffered === "number") {
      this.bufferedSeconds = update.buffered;
    }

    if (update.error) {
      this.status = "error";
      this.currentError = createAppError("unknown", "Audio playback error", {
        technicalMessage: String(update.error),
      });
    }

    // Natural completion check
    if (update.didJustFinish && !this.isCompleting && this.currentTrack) {
      this.isCompleting = true;
      this.naturalFinishTrackId = this.currentTrack.id;

      for (const listener of this.completeListeners) {
        try {
          listener(this.currentTrack);
        } catch {
          /* Ignore listener errors */
        }
      }
    }

    this.notifyState();
  }

  async play(track: Track): Promise<void> {
    const player = await this.ensurePlayer();

    // Pause audio immediately to prevent overlaps
    try {
      player.pause();
    } catch {
      /* Player may not be initialized yet */
    }

    // Signal skip on outgoing track if it didn't finish naturally
    if (
      this.currentTrack &&
      this.loadedTrackId === this.currentTrack.id &&
      this.naturalFinishTrackId !== this.currentTrack.id
    ) {
      const fraction =
        this.durationSeconds > 0
          ? this.positionSeconds / this.durationSeconds
          : 0;
      for (const listener of this.skipListeners) {
        try {
          listener(this.currentTrack, Math.min(1, Math.max(0, fraction)));
        } catch {
          /* Ignore listener errors */
        }
      }
    }

    // Cancel previous resolution
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.currentAbortController = new AbortController();
    const generation = ++this.loadGeneration;

    this.currentTrack = track;
    this.status = "loading";
    this.currentError = null;
    this.positionSeconds = 0;
    this.durationSeconds = track.durationSeconds ?? 0;
    this.isCompleting = false;
    this.notifyState();

    try {
      const stream = await this.resolver.resolve(
        track,
        this.currentAbortController.signal,
      );

      // Discard stale resolution if user tapped another track
      if (generation !== this.loadGeneration) {
        return;
      }

      player.replace({
        uri: stream.url,
        headers: stream.userAgent
          ? { "User-Agent": stream.userAgent }
          : undefined,
      });

      this.loadedTrackId = track.id;

      try {
        player.setActiveForLockScreen(
          true,
          {
            title: track.title,
            artist: track.artist,
            artworkUrl: track.artwork,
          },
          { showSeekBackward: true, showSeekForward: true },
        );
      } catch {
        /* Lock screen controls might fail on web/tests */
      }

      player.play();
      this.status = "playing";
      this.notifyState();
    } catch (err: unknown) {
      if (generation !== this.loadGeneration) return;

      this.status = "error";
      this.currentError = isAppError(err)
        ? err
        : createAppError("unknown", "Failed to play track", {
            technicalMessage: err instanceof Error ? err.message : String(err),
            cause: err,
          });
      this.notifyState();
      throw this.currentError;
    }
  }

  pause(): void {
    if (this.player && this.status === "playing") {
      this.player.pause();
      this.status = "paused";
      this.notifyState();
    }
  }

  resume(): void {
    if (this.player && (this.status === "paused" || this.status === "idle")) {
      this.player.play();
      this.status = "playing";
      this.notifyState();
    }
  }

  async seek(seconds: number): Promise<void> {
    if (this.player) {
      await this.player.seekTo(seconds);
      this.positionSeconds = seconds;
      this.notifyState();
    }
  }

  stop(): void {
    if (this.player) {
      this.player.pause();
      this.status = "idle";
      this.currentTrack = null;
      this.positionSeconds = 0;
      this.durationSeconds = 0;
      this.notifyState();
    }
  }

  getSnapshot(): PlaybackSnapshot {
    return {
      currentTrack: this.currentTrack,
      status: this.status,
      positionSeconds: this.positionSeconds,
      durationSeconds: this.durationSeconds,
      bufferedSeconds: this.bufferedSeconds,
      error: this.currentError,
    };
  }

  onStateChange(listener: PlaybackListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getSnapshot());
    return () => this.stateListeners.delete(listener);
  }

  onTrackComplete(listener: CompletionListener): () => void {
    this.completeListeners.add(listener);
    return () => this.completeListeners.delete(listener);
  }

  onTrackSkip(listener: SkipListener): () => void {
    this.skipListeners.add(listener);
    return () => this.skipListeners.delete(listener);
  }

  private notifyState(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.stateListeners) {
      try {
        listener(snapshot);
      } catch {
        /* Ignore listener errors */
      }
    }
  }
}

export const defaultPlaybackEngine = new PlaybackEngine();
