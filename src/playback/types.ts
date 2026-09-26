import { Track } from "../core/types";
import { AppError } from "../core/errors";

export type RepeatMode = "off" | "all" | "one";

export type QueueState = {
  items: Track[];
  currentIndex: number;
  shuffledIndices: number[];
  isShuffled: boolean;
  repeatMode: RepeatMode;
};

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

export type PlaybackSnapshot = {
  currentTrack: Track | null;
  status: PlayerStatus;
  positionSeconds: number;
  durationSeconds: number;
  bufferedSeconds: number;
  error: AppError | null;
};
