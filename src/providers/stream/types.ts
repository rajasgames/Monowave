import { Track, ResolvedStream } from "../../core/types";

export interface StreamSource {
  readonly id: string;
  canHandle(track: Track): boolean;
  resolve(track: Track, signal?: AbortSignal): Promise<ResolvedStream>;
}
