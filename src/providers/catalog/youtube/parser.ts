import { Track, SearchResult } from "../../../core/types";
import { ParsedLink } from "./types";

// Safely extract text from YouTube runs arrays
export function parseRuns(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const obj = node as { runs?: Array<{ text?: string }> };
  if (!Array.isArray(obj.runs)) return "";
  return obj.runs
    .map((entry) => (typeof entry?.text === "string" ? entry.text : ""))
    .join("")
    .trim();
}

// Safely extract the highest quality thumbnail URL
export function parseThumbnail(node: unknown): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  const obj = node as {
    musicThumbnailRenderer?: {
      thumbnail?: { thumbnails?: Array<{ url?: string }> };
    };
    thumbnailRenderer?: {
      musicThumbnailRenderer?: {
        thumbnail?: { thumbnails?: Array<{ url?: string }> };
      };
    };
    thumbnails?: Array<{ url?: string }>;
    thumbnail?: { thumbnails?: Array<{ url?: string }> };
  };

  const choices =
    obj.musicThumbnailRenderer?.thumbnail?.thumbnails ??
    obj.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ??
    obj.thumbnails ??
    obj.thumbnail?.thumbnails ??
    [];

  if (Array.isArray(choices) && choices.length > 0) {
    const valid = choices.filter((c) => typeof c?.url === "string");
    return valid.at(-1)?.url;
  }
  return undefined;
}

// Safely parse duration format (e.g. "3:45" or "1:15:30") to seconds
export function parseDurationSeconds(text: string): number | undefined {
  if (!text || typeof text !== "string") return undefined;
  const trimmed = text.trim();
  if (!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(trimmed)) return undefined;
  const parts = trimmed.split(":").map(Number);
  if (parts.some(isNaN)) return undefined;
  return parts.reduce((acc, part) => acc * 60 + part, 0);
}

// Traverse JSON trees with depth and count bounds to prevent recursion blowups or circular loops
export function findRenderers(
  root: unknown,
  rendererName: string,
  maxResults = 250,
): unknown[] {
  const results: unknown[] = [];
  const visited = new Set<unknown>();

  function walk(current: unknown, depth: number) {
    if (
      !current ||
      typeof current !== "object" ||
      results.length >= maxResults ||
      depth > 30 ||
      visited.has(current)
    ) {
      return;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        walk(item, depth + 1);
        if (results.length >= maxResults) break;
      }
    } else {
      const record = current as Record<string, unknown>;
      if (record[rendererName]) {
        results.push(record[rendererName]);
      }
      for (const key of Object.keys(record)) {
        walk(record[key], depth + 1);
        if (results.length >= maxResults) break;
      }
    }
  }

  walk(root, 0);
  return results;
}

// Parse a single responsive list item into a domain Track or entity
export function parseResponsiveListItem(node: unknown): {
  track?: Track;
  artist?: { id: string; name: string; artwork?: string };
  album?: { id: string; title: string; artist: string; artwork?: string };
  playlist?: { id: string; title: string; artwork?: string };
} | null {
  if (!node || typeof node !== "object") return null;
  const renderer = node as Record<string, any>;

  const flexColumns = Array.isArray(renderer.flexColumns)
    ? renderer.flexColumns
    : [];
  const titleText = parseRuns(
    flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text,
  );
  if (!titleText) return null;

  const secondaryParts: string[] = [];
  let artistBrowseId: string | undefined;

  for (let i = 1; i < flexColumns.length; i++) {
    const col = flexColumns[i]?.musicResponsiveListItemFlexColumnRenderer?.text;
    const runsList = Array.isArray(col?.runs) ? col.runs : [];
    for (const run of runsList) {
      if (run?.text) secondaryParts.push(run.text);
      const bId = run?.navigationEndpoint?.browseEndpoint?.browseId;
      if (typeof bId === "string" && bId.startsWith("UC") && !artistBrowseId) {
        artistBrowseId = bId;
      }
    }
  }

  const secondary = secondaryParts.join(" · ");
  const videoId =
    renderer.playlistItemData?.videoId ??
    renderer.navigationEndpoint?.watchEndpoint?.videoId ??
    renderer.overlay?.musicItemThumbnailOverlayRenderer?.content
      ?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

  const browseId = renderer.navigationEndpoint?.browseEndpoint?.browseId;
  const artwork = parseThumbnail(renderer.thumbnail);

  if (typeof videoId === "string" && videoId.length === 11) {
    const artist =
      secondaryParts.find((x) => x && !/^song$|^video$/i.test(x)) ||
      "Unknown artist";
    const duration = parseDurationSeconds(secondaryParts.at(-1) ?? "");

    const track: Track = {
      id: `youtube:${videoId}`,
      provider: "youtube",
      sourceId: videoId,
      title: titleText,
      artist,
      artistId: artistBrowseId,
      artwork,
      durationSeconds: duration,
    };
    return { track };
  }

  if (typeof browseId === "string") {
    if (browseId.startsWith("UC")) {
      return { artist: { id: browseId, name: titleText, artwork } };
    }
    if (browseId.startsWith("MPRE")) {
      return {
        album: {
          id: browseId,
          title: titleText,
          artist: secondaryParts[0] || "Unknown artist",
          artwork,
        },
      };
    }
    return { playlist: { id: browseId, title: titleText, artwork } };
  }

  return null;
}

// Parse a playlist panel video renderer (often returned in queue/radio responses)
export function parsePlaylistPanelVideo(node: unknown): Track | null {
  if (!node || typeof node !== "object") return null;
  const renderer = node as Record<string, any>;

  const videoId = renderer.videoId;
  const title = parseRuns(renderer.title);
  if (typeof videoId !== "string" || !title) return null;

  const artist =
    parseRuns(renderer.shortBylineText) ||
    parseRuns(renderer.longBylineText) ||
    "Unknown artist";

  let artistId: string | undefined;
  const runsList =
    renderer.longBylineText?.runs ?? renderer.shortBylineText?.runs ?? [];
  for (const run of runsList) {
    const bId = run?.navigationEndpoint?.browseEndpoint?.browseId;
    if (typeof bId === "string" && bId.startsWith("UC")) {
      artistId = bId;
      break;
    }
  }

  const duration = parseDurationSeconds(parseRuns(renderer.lengthText));
  const artwork = parseThumbnail(renderer.thumbnail);

  return {
    id: `youtube:${videoId}`,
    provider: "youtube",
    sourceId: videoId,
    title,
    artist,
    artistId,
    artwork,
    durationSeconds: duration,
  };
}

// Extract full search / browse result from YouTube response
export function parseSearchResult(json: unknown): SearchResult {
  const result: SearchResult = {
    tracks: [],
    artists: [],
    albums: [],
    playlists: [],
  };

  const listItems = findRenderers(json, "musicResponsiveListItemRenderer");
  for (const item of listItems) {
    const parsed = parseResponsiveListItem(item);
    if (!parsed) continue;
    if (parsed.track) result.tracks.push(parsed.track);
    if (parsed.artist) result.artists.push(parsed.artist);
    if (parsed.album) result.albums.push(parsed.album);
    if (parsed.playlist) result.playlists.push(parsed.playlist);
  }

  const panelItems = findRenderers(json, "playlistPanelVideoRenderer");
  for (const item of panelItems) {
    const track = parsePlaylistPanelVideo(item);
    if (track) result.tracks.push(track);
  }

  // Deduplicate tracks by id
  const trackMap = new Map<string, Track>();
  for (const t of result.tracks) {
    if (!trackMap.has(t.id)) trackMap.set(t.id, t);
  }
  result.tracks = Array.from(trackMap.values());

  return result;
}

// Parse YouTube / YouTube Music URL
export function parseYouTubeLink(input: string): ParsedLink {
  if (!input || typeof input !== "string") return null;
  try {
    const url = new URL(input.trim());
    if (
      ![
        "music.youtube.com",
        "www.youtube.com",
        "youtube.com",
        "youtu.be",
      ].includes(url.hostname)
    ) {
      return null;
    }

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
        return { kind: "track", id };
      }
      return null;
    }

    const list = url.searchParams.get("list");
    if (list && /^[A-Za-z0-9_-]+$/.test(list)) {
      return { kind: "playlist", id: list };
    }

    const id = url.searchParams.get("v");
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
      return { kind: "track", id };
    }
  } catch {
    // Non-URL input
  }
  return null;
}
