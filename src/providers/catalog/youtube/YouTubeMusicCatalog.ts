import { MusicCatalog } from "../MusicCatalog";
import { Track, SearchResult } from "../../../core/types";
import { YouTubeClient, defaultYouTubeClient } from "./client";
import {
  parseSearchResult,
  findRenderers,
  parsePlaylistPanelVideo,
} from "./parser";
import { RadioQueueResult } from "./types";

export class YouTubeMusicCatalog implements MusicCatalog {
  private readonly client: YouTubeClient;

  constructor(client: YouTubeClient = defaultYouTubeClient) {
    this.client = client;
  }

  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }
    const response = await this.client.post(
      "search",
      { query: trimmed },
      signal,
    );
    return parseSearchResult(response);
  }

  async browse(id: string, signal?: AbortSignal): Promise<SearchResult> {
    const browseId = id.startsWith("PL") ? `VL${id}` : id;
    const response = await this.client.post("browse", { browseId }, signal);
    return parseSearchResult(response);
  }

  async getTrack(id: string, signal?: AbortSignal): Promise<Track> {
    const cleanId = id.startsWith("youtube:") ? id.replace("youtube:", "") : id;
    const response = await this.client.post(
      "next",
      { videoId: cleanId, isAudioOnly: true },
      signal,
    );
    const parsed = parseSearchResult(response);
    const found = parsed.tracks.find((t) => t.sourceId === cleanId);
    if (found) {
      return found;
    }
    return {
      id: `youtube:${cleanId}`,
      provider: "youtube",
      sourceId: cleanId,
      title: `Track ${cleanId}`,
      artist: "Unknown artist",
    };
  }

  async getRadio(seed: Track, signal?: AbortSignal): Promise<Track[]> {
    const radioData = await this.getRadioWithArtistMap(seed.sourceId, signal);
    return radioData.tracks;
  }

  async getRadioWithArtistMap(
    videoId: string,
    signal?: AbortSignal,
  ): Promise<RadioQueueResult> {
    const response = await this.client.post(
      "next",
      {
        videoId,
        playlistId: `RDAMVM${videoId}`,
        isAudioOnly: true,
      },
      signal,
    );

    const parsed = parseSearchResult(response);
    const relatedTracks = parsed.tracks.filter((t) => t.sourceId !== videoId);

    const artistIds: Record<string, string> = {};
    const panelRenderers = findRenderers(
      response,
      "playlistPanelVideoRenderer",
    ) as any[];
    for (const renderer of panelRenderers) {
      const runs =
        renderer?.longBylineText?.runs ?? renderer?.shortBylineText?.runs ?? [];
      for (const run of runs) {
        const bId = run?.navigationEndpoint?.browseEndpoint?.browseId;
        const name = typeof run?.text === "string" ? run.text.trim() : "";
        if (
          typeof bId === "string" &&
          bId.startsWith("UC") &&
          name &&
          !artistIds[name]
        ) {
          artistIds[name] = bId;
        }
      }
    }

    return {
      tracks: relatedTracks,
      artistIds,
    };
  }
}

export const defaultYouTubeMusicCatalog = new YouTubeMusicCatalog();
