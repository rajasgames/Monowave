import { PixelRatio } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../state/PlayerContext";

export function formatTime(value: number) {
  const n = Math.max(0, Math.floor(value));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

export function timeAgo(at: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - at) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export type ThumbnailItem = {
  url?: string;
  width?: number;
  height?: number;
};

/**
 * Selects the highest quality thumbnail by inspecting width and height metadata
 * rather than relying on array order.
 */
export function selectLargestThumbnail(
  choices?: ThumbnailItem[] | null,
): string | undefined {
  if (!Array.isArray(choices) || choices.length === 0) return undefined;
  const valid = choices.filter(
    (c): c is ThumbnailItem & { url: string } =>
      typeof c?.url === "string" && c.url.trim().length > 0,
  );
  if (valid.length === 0) return undefined;

  let best = valid[0];
  let maxDim = (best.width ?? 0) * (best.height ?? 0);

  for (let i = 1; i < valid.length; i++) {
    const item = valid[i];
    const itemDim = (item.width ?? 0) * (item.height ?? 0);
    if (
      itemDim > maxDim ||
      (itemDim === maxDim && (item.width ?? 0) > (best.width ?? 0))
    ) {
      best = item;
      maxDim = itemDim;
    } else if (
      maxDim === 0 &&
      i === valid.length - 1 &&
      !item.width &&
      !item.height
    ) {
      best = item;
    }
  }

  return best.url;
}

/**
 * Normalizes supported YouTube/Google artwork URLs to request high quality
 * appropriate for the rendered size and device pixel density.
 * Rejects base64 or ephemeral stream URLs.
 */
export function normalizeArtworkUrl(
  url?: string,
  targetSize: number = 64,
  pixelRatio?: number,
): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Never allow base64 or temporary stream URLs
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.includes("googlevideo.com/videoplayback")
  ) {
    return undefined;
  }

  let pr = pixelRatio;
  if (typeof pr !== "number") {
    try {
      pr = typeof PixelRatio?.get === "function" ? PixelRatio.get() : 2;
    } catch {
      pr = 2;
    }
  }
  const targetPx = Math.min(Math.max(Math.ceil(targetSize * pr), 64), 1024);

  try {
    if (
      trimmed.includes("googleusercontent.com") ||
      trimmed.includes("ggpht.com") ||
      trimmed.includes("ytimg.com")
    ) {
      // Dimension specifiers: =w120-h120-l90-rj, =w544-h544, etc.
      if (/=w\d+-h\d+[^?#]*/.test(trimmed)) {
        return trimmed.replace(
          /=w\d+-h\d+[^?#]*/,
          `=w${targetPx}-h${targetPx}-l90-rj`,
        );
      }
      // Size specifiers: =s88-c-k-c0x00ffffff-no-rj, =s60, etc.
      if (/=s\d+[^?#]*/.test(trimmed)) {
        return trimmed.replace(/=s\d+[^?#]*/, `=s${targetPx}-c`);
      }
      // Standard video thumbnails: default.jpg, mqdefault.jpg -> upgrade for sharpness
      if (trimmed.includes("/vi/") || trimmed.includes("/vi_webp/")) {
        if (targetPx > 180) {
          return trimmed.replace(
            /(default|mqdefault|hqdefault|sddefault)\.(jpg|webp)/,
            "hqdefault.$2",
          );
        }
      }
    }
  } catch {
    // If URL manipulation fails, return trimmed original
  }

  return trimmed;
}

/**
 * Calculates responsive safe-area content insets and bottom clearance
 * for scrollable screens so content is never covered by the status bar,
 * tab bar, mini-player, or Android system navigation bar.
 */
export function useScreenContentPadding(options?: {
  isModal?: boolean;
  hasMiniPlayer?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const hasPlayer =
    options?.hasMiniPlayer !== undefined
      ? options.hasMiniPlayer
      : !!player?.current;

  const paddingTop = Math.max(insets.top, 14);

  let paddingBottom: number;
  if (options?.isModal) {
    // For modal / stack screens
    paddingBottom = hasPlayer ? 96 + insets.bottom : 32 + insets.bottom;
  } else {
    // For tab screens:
    // TabBar height = 56 + insets.bottom
    // MiniPlayer height = 66, gap above tab bar = 10, item clearance = 20
    paddingBottom = hasPlayer ? 152 + insets.bottom : 84 + insets.bottom;
  }

  return {
    paddingTop,
    paddingBottom,
    paddingHorizontal: 22,
  };
}
