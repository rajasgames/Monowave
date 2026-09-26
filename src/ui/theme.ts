import type { SearchItem } from "../music";

export type Filter = "all" | SearchItem["kind"];

export const C = {
  bg: "#080812",
  bgRaised: "#0D0D1A",
  panel: "#131326",
  panelSoft: "#18172E",
  panelStrong: "#211D3A",
  text: "#F8F7FF",
  muted: "#AAA5C1",
  faint: "#77728F",
  accent: "#B46BFF",
  accent2: "#8F7CFF",
  accentSoft: "#B46BFF24",
  blue: "#64A8FF",
  pink: "#FF66B7",
  mint: "#58D8C0",
  orange: "#FF9B54",
  line: "#FFFFFF16",
  lineStrong: "#B46BFF55",
  danger: "#FF7A9B",
};

export const MOODS = [
  { label: "Chill", icon: "◌", query: "chill music", tint: "#183B6D" },
  { label: "Party", icon: "✦", query: "party hits", tint: "#57204F" },
  { label: "Sad", icon: "☾", query: "sad songs", tint: "#25303D" },
  { label: "Romance", icon: "♥", query: "romantic songs", tint: "#6A2448" },
  { label: "Workout", icon: "◆", query: "workout music", tint: "#4A2E22" },
  { label: "Focus", icon: "◎", query: "focus music", tint: "#2B3D32" },
];

export const CATEGORY_FILTERS: {
  label: string;
  icon: string;
  filter: Filter;
  tint: string;
}[] = [
  { label: "Songs", icon: "library", filter: "track", tint: "#213B8C" },
  { label: "Albums", icon: "◉", filter: "album", tint: "#59217D" },
  { label: "Artists", icon: "●", filter: "artist", tint: "#166D67" },
  { label: "Playlists", icon: "≡", filter: "playlist", tint: "#8A451E" },
];
