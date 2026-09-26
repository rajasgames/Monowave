import { Track, SearchResult } from "../../core/types";

export interface MusicCatalog {
  search(query: string, signal?: AbortSignal): Promise<SearchResult>;
  browse(id: string, signal?: AbortSignal): Promise<SearchResult>;
  getTrack(id: string, signal?: AbortSignal): Promise<Track>;
  getRadio(seed: Track, signal?: AbortSignal): Promise<Track[]>;
}
