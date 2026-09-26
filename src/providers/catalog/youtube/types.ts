import { Track } from "../../../core/types";

export type YouTubeContext = {
  client: {
    clientName: string;
    clientVersion: string;
    hl: string;
    gl: string;
  };
};

export type YouTubeSearchFilter =
  "all" | "songs" | "albums" | "artists" | "playlists";

export type ParsedLink =
  { kind: "track"; id: string } | { kind: "playlist"; id: string } | null;

export type RadioQueueResult = {
  tracks: Track[];
  artistIds: Record<string, string>;
};
