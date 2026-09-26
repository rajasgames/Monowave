export type Track = {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  duration?: number;
};
export type SearchItem = {
  id: string;
  kind: "track" | "album" | "artist" | "playlist";
  title: string;
  subtitle: string;
  cover?: string;
  track?: Track;
};

const BASE = "https://music.youtube.com/youtubei/v1";
const CONTEXT = {
  client: {
    clientName: "WEB_REMIX",
    clientVersion: "1.20240101.01.00",
    hl: "en",
    gl: "US",
  },
};

async function request(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<any> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 13000);
  
  const onAbort = () => abort.abort();
  if (signal) signal.addEventListener("abort", onAbort);
  try {
    const response = await fetch(`${BASE}/${endpoint}?prettyPrint=false`, {
      method: "POST",
      signal: abort.signal,
      headers: {
        "Content-Type": "application/json",
        Origin: "https://music.youtube.com",
      },
      body: JSON.stringify({ context: CONTEXT, ...body }),
    });
    if (!response.ok)
      throw new Error(`YouTube Music returned HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

function findRenderers(node: unknown, name: string, out: any[] = []): any[] {
  if (!node || typeof node !== "object" || out.length >= 400) return out;
  if (Array.isArray(node)) {
    node.forEach((child) => findRenderers(child, name, out));
  } else {
    const obj = node as Record<string, unknown>;
    if (obj[name]) out.push(obj[name]);
    Object.values(obj).forEach((child) => findRenderers(child, name, out));
  }
  return out;
}

function runs(value: any): string {
  return (value?.runs ?? [])
    .map((entry: any) => entry?.text ?? "")
    .join("")
    .trim();
}
function thumb(value: any): string | undefined {
  const choices =
    value?.musicThumbnailRenderer?.thumbnail?.thumbnails ??
    value?.thumbnails ??
    value?.thumbnail?.thumbnails ??
    [];
  return choices.at(-1)?.url;
}
function seconds(value: string): number | undefined {
  if (!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(value)) return;
  return value.split(":").reduce((acc, part) => acc * 60 + Number(part), 0);
}

function row(renderer: any): SearchItem | null {
  const title = runs(
    renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text,
  );
  const secondary =
    renderer?.flexColumns
      ?.slice(1)
      .map((column: any) =>
        runs(column?.musicResponsiveListItemFlexColumnRenderer?.text),
      )
      .filter(Boolean)
      .join(" · ") ?? "";
  const videoId =
    renderer?.playlistItemData?.videoId ??
    renderer?.navigationEndpoint?.watchEndpoint?.videoId ??
    renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content
      ?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
  const browseId = renderer?.navigationEndpoint?.browseEndpoint?.browseId;
  const cover = thumb(renderer?.thumbnail);
  if (!title) return null;
  if (videoId) {
    const artist =
      secondary
        .split(" • ")
        .find((x: string) => x && !/^song$|^video$/i.test(x)) ||
      "Unknown artist";
    const track: Track = {
      id: videoId,
      title,
      artist,
      cover,
      duration: seconds(secondary.split(" • ").at(-1) ?? ""),
    };
    return {
      id: videoId,
      title,
      subtitle: secondary || artist,
      cover,
      kind: "track",
      track,
    };
  }
  if (browseId) {
    const kind = browseId.startsWith("UC")
      ? "artist"
      : browseId.startsWith("MPRE")
        ? "album"
        : "playlist";
    return { id: browseId, title, subtitle: secondary, cover, kind };
  }
  return null;
}

function card(renderer: any): SearchItem | null {
  const title = runs(renderer?.title);
  const subtitle = runs(renderer?.subtitle);
  const id = renderer?.navigationEndpoint?.browseEndpoint?.browseId;
  if (!title || !id) return null;
  return {
    id,
    title,
    subtitle,
    cover: thumb(renderer?.thumbnailRenderer),
    kind: id.startsWith("UC")
      ? "artist"
      : id.startsWith("MPRE")
        ? "album"
        : "playlist",
  };
}

function extract(json: any): SearchItem[] {
  const items = [
    ...findRenderers(json, "musicResponsiveListItemRenderer").map(row),
    ...findRenderers(json, "musicTwoRowItemRenderer").map(card),
    ...findRenderers(json, "playlistPanelVideoRenderer").map(
      (renderer: any): SearchItem | null => {
        const id = renderer?.videoId;
        const title = runs(renderer?.title);
        if (!id || !title) return null;
        const artist =
          runs(renderer?.shortBylineText) ||
          runs(renderer?.longBylineText) ||
          "Unknown artist";
        const track: Track = {
          id,
          title,
          artist,
          cover: thumb(renderer?.thumbnail),
          duration: seconds(runs(renderer?.lengthText)),
        };
        return {
          id,
          title,
          subtitle: artist,
          cover: track.cover,
          kind: "track",
          track,
        };
      },
    ),
  ].filter((item): item is SearchItem => item !== null);
  return [
    ...new Map(items.map((item) => [`${item.kind}:${item.id}`, item])).values(),
  ];
}

export async function searchMusic(query: string, signal?: AbortSignal): Promise<SearchItem[]> {
  const response = await request("search", { query }, signal);
  return extract(response).slice(0, 80);
}

export async function browseMusic(id: string): Promise<SearchItem[]> {
  const response = await request("browse", {
    browseId: id.startsWith("PL") ? `VL${id}` : id,
  });
  return extract(response).slice(0, 200);
}

export async function trackById(id: string): Promise<Track> {
  const response = await request("next", { videoId: id, isAudioOnly: true });
  return (
    extract(response).find((item) => item.kind === "track" && item.id === id)
      ?.track ?? { id, title: `YouTube track ${id}`, artist: "Unknown artist" }
  );
}

/**
 * Fetches YouTube Music's own radio/related queue for a seed video.
 * Uses the same `next` endpoint YouTube Music uses for "Start radio",
 * passing the RDAMVM automix playlist id. Returns real related tracks
 * (excluding the seed itself) plus a map of artist name -> channel
 * browseId scraped from the queue's byline links, so callers can
 * resolve "more from this artist" without extra searches.
 */
export async function fetchRadioTracks(
  videoId: string,
): Promise<{ tracks: Track[]; artistIds: Record<string, string> }> {
  const response = await request("next", {
    videoId,
    playlistId: `RDAMVM${videoId}`,
    isAudioOnly: true,
  });
  const tracks = extract(response)
    .filter(
      (item) => item.kind === "track" && item.track && item.id !== videoId,
    )
    .map((item) => item.track!);
  const artistIds: Record<string, string> = {};
  for (const renderer of findRenderers(
    response,
    "playlistPanelVideoRenderer",
  )) {
    for (const run of renderer?.longBylineText?.runs ?? []) {
      const browseId = run?.navigationEndpoint?.browseEndpoint?.browseId;
      const name = typeof run?.text === "string" ? run.text.trim() : "";
      if (browseId?.startsWith("UC") && name && !artistIds[name])
        artistIds[name] = browseId;
    }
  }
  return { tracks, artistIds };
}

/** Fetches an artist page and returns their tracks (top songs shelf first). */
export async function fetchArtistTracks(browseId: string): Promise<Track[]> {
  const items = await browseMusic(browseId);
  return items
    .filter((item) => item.kind === "track" && item.track)
    .map((item) => item.track!);
}

export function parseLink(
  input: string,
): { kind: "track" | "playlist"; id: string } | null {
  try {
    const url = new URL(input.trim());
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return { kind: "track", id };
    }
    if (
      !["music.youtube.com", "www.youtube.com", "youtube.com"].includes(
        url.hostname,
      )
    )
      return null;
    const list = url.searchParams.get("list");
    if (list && /^[A-Za-z0-9_-]+$/.test(list))
      return { kind: "playlist", id: list };
    const id = url.searchParams.get("v");
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { kind: "track", id };
  } catch {
    /* Input is not a URL. */
  }
  return null;
}
