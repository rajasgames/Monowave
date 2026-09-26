import { Track } from "../core/types";
import { QueueState, RepeatMode } from "./types";

// Fisher-Yates shuffle that keeps the current index as the first item if specified
export function generateShuffledOrder(
  length: number,
  preserveIndex?: number,
): number[] {
  if (length <= 0) return [];
  const indices = Array.from({ length }, (_, i) => i);

  if (
    preserveIndex !== undefined &&
    preserveIndex >= 0 &&
    preserveIndex < length
  ) {
    // Swap preserveIndex to the front
    const temp = indices[0];
    indices[0] = indices[preserveIndex];
    indices[preserveIndex] = temp;

    // Shuffle the rest of the array
    for (let i = length - 1; i > 1; i--) {
      const j = 1 + Math.floor(Math.random() * i);
      const swap = indices[i];
      indices[i] = indices[j];
      indices[j] = swap;
    }
  } else {
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = indices[i];
      indices[i] = indices[j];
      indices[j] = swap;
    }
  }

  return indices;
}

export function createInitialQueue(
  items: Track[] = [],
  startIndex = 0,
  isShuffled = false,
  repeatMode: RepeatMode = "off",
): QueueState {
  const safeIndex =
    items.length > 0 ? Math.max(0, Math.min(startIndex, items.length - 1)) : 0;
  const shuffledIndices = isShuffled
    ? generateShuffledOrder(items.length, safeIndex)
    : Array.from({ length: items.length }, (_, i) => i);

  return {
    items,
    currentIndex: safeIndex,
    shuffledIndices,
    isShuffled,
    repeatMode,
  };
}

export function getNextIndex(state: QueueState): number | null {
  const { items, currentIndex, isShuffled, shuffledIndices, repeatMode } =
    state;
  if (items.length === 0) return null;

  if (repeatMode === "one") {
    return currentIndex;
  }

  if (isShuffled) {
    const currentOrderPos = shuffledIndices.indexOf(currentIndex);
    if (
      currentOrderPos === -1 ||
      currentOrderPos + 1 >= shuffledIndices.length
    ) {
      return repeatMode === "all" ? shuffledIndices[0] : null;
    }
    return shuffledIndices[currentOrderPos + 1];
  }

  if (currentIndex + 1 >= items.length) {
    return repeatMode === "all" ? 0 : null;
  }
  return currentIndex + 1;
}

export function getPreviousIndex(state: QueueState): number | null {
  const { items, currentIndex, isShuffled, shuffledIndices, repeatMode } =
    state;
  if (items.length === 0) return null;

  if (repeatMode === "one") {
    return currentIndex;
  }

  if (isShuffled) {
    const currentOrderPos = shuffledIndices.indexOf(currentIndex);
    if (currentOrderPos <= 0) {
      return repeatMode === "all"
        ? shuffledIndices[shuffledIndices.length - 1]
        : null;
    }
    return shuffledIndices[currentOrderPos - 1];
  }

  if (currentIndex - 1 < 0) {
    return repeatMode === "all" ? items.length - 1 : null;
  }
  return currentIndex - 1;
}

export function enqueue(state: QueueState, track: Track): QueueState {
  const newItems = [...state.items, track];
  const newShuffled = state.isShuffled
    ? [...state.shuffledIndices, newItems.length - 1]
    : Array.from({ length: newItems.length }, (_, i) => i);

  return {
    ...state,
    items: newItems,
    shuffledIndices: newShuffled,
  };
}

export function playNext(state: QueueState, track: Track): QueueState {
  const insertIndex = state.items.length === 0 ? 0 : state.currentIndex + 1;
  const newItems = [
    ...state.items.slice(0, insertIndex),
    track,
    ...state.items.slice(insertIndex),
  ];

  // Rebuild indices
  const newShuffled = state.isShuffled
    ? generateShuffledOrder(newItems.length, state.currentIndex)
    : Array.from({ length: newItems.length }, (_, i) => i);

  return {
    ...state,
    items: newItems,
    shuffledIndices: newShuffled,
  };
}

export function removeFromQueue(
  state: QueueState,
  removeIndex: number,
): QueueState {
  if (removeIndex < 0 || removeIndex >= state.items.length) {
    return state;
  }

  const newItems = state.items.filter((_, idx) => idx !== removeIndex);
  let newCurrentIndex = state.currentIndex;

  if (newItems.length === 0) {
    newCurrentIndex = 0;
  } else if (removeIndex < state.currentIndex) {
    newCurrentIndex = Math.max(0, state.currentIndex - 1);
  } else if (
    removeIndex === state.currentIndex &&
    newCurrentIndex >= newItems.length
  ) {
    newCurrentIndex = newItems.length - 1;
  }

  const newShuffled = state.isShuffled
    ? generateShuffledOrder(newItems.length, newCurrentIndex)
    : Array.from({ length: newItems.length }, (_, i) => i);

  return {
    ...state,
    items: newItems,
    currentIndex: newCurrentIndex,
    shuffledIndices: newShuffled,
  };
}

export function reorderQueue(
  state: QueueState,
  fromIndex: number,
  toIndex: number,
): QueueState {
  if (
    fromIndex < 0 ||
    fromIndex >= state.items.length ||
    toIndex < 0 ||
    toIndex >= state.items.length ||
    fromIndex === toIndex
  ) {
    return state;
  }

  const currentTrack = state.items[state.currentIndex];
  const newItems = [...state.items];
  const [removed] = newItems.splice(fromIndex, 1);
  newItems.splice(toIndex, 0, removed);

  const newCurrentIndex = newItems.indexOf(currentTrack);

  return {
    ...state,
    items: newItems,
    currentIndex: newCurrentIndex >= 0 ? newCurrentIndex : 0,
    shuffledIndices: Array.from({ length: newItems.length }, (_, i) => i),
    isShuffled: false, // Disables shuffle upon manual reorder for consistency
  };
}

export function toggleShuffle(state: QueueState): QueueState {
  const nextIsShuffled = !state.isShuffled;
  const newShuffled = nextIsShuffled
    ? generateShuffledOrder(state.items.length, state.currentIndex)
    : Array.from({ length: state.items.length }, (_, i) => i);

  return {
    ...state,
    isShuffled: nextIsShuffled,
    shuffledIndices: newShuffled,
  };
}

export function cycleRepeatMode(current: RepeatMode): RepeatMode {
  if (current === "off") return "all";
  if (current === "all") return "one";
  return "off";
}
