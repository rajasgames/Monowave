import {
  parseDurationSeconds,
  parseRuns,
  parseThumbnail,
  parseSearchResult,
  parseYouTubeLink,
} from "../../../src/providers/catalog/youtube/parser";
import fixtureData from "../../fixtures/youtube/searchResponse.json";

describe("YouTube catalog parser", () => {
  it("parses duration strings correctly", () => {
    expect(parseDurationSeconds("3:45")).toBe(225);
    expect(parseDurationSeconds("0:30")).toBe(30);
    expect(parseDurationSeconds("1:02:05")).toBe(3725);
    expect(parseDurationSeconds("invalid")).toBeUndefined();
    expect(parseDurationSeconds("")).toBeUndefined();
  });

  it("extracts runs text cleanly", () => {
    expect(parseRuns({ runs: [{ text: "Hello " }, { text: "World" }] })).toBe(
      "Hello World",
    );
    expect(parseRuns(null)).toBe("");
    expect(parseRuns({})).toBe("");
  });

  it("selects the largest thumbnail URL available", () => {
    const thumbNode = {
      musicThumbnailRenderer: {
        thumbnail: {
          thumbnails: [
            { url: "https://img.com/small.jpg" },
            { url: "https://img.com/large.jpg" },
          ],
        },
      },
    };
    expect(parseThumbnail(thumbNode)).toBe("https://img.com/large.jpg");
    expect(parseThumbnail(null)).toBeUndefined();
  });

  it("parses real response fixture into domain Track and Artist entities", () => {
    const result = parseSearchResult(fixtureData);

    expect(result.tracks.length).toBe(1);
    const track = result.tracks[0];
    expect(track.id).toBe("youtube:dX3k_QDnzHE");
    expect(track.sourceId).toBe("dX3k_QDnzHE");
    expect(track.provider).toBe("youtube");
    expect(track.title).toBe("Midnight City");
    expect(track.artist).toBe("M83");
    expect(track.artistId).toBe("UC1234567890abcdef");
    expect(track.durationSeconds).toBe(243);
    expect(track.artwork).toBe(
      "https://lh3.googleusercontent.com/test_image_large.jpg",
    );

    expect(result.artists.length).toBe(1);
    expect(result.artists[0].id).toBe("UCartistChannelId12345");
    expect(result.artists[0].name).toBe("Artist Profile Test");
  });

  it("handles empty or malformed inputs without crashing", () => {
    expect(parseSearchResult({})).toEqual({
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
    });
    expect(parseSearchResult(null)).toEqual({
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
    });
  });

  it("parses YouTube links accurately", () => {
    expect(
      parseYouTubeLink("https://music.youtube.com/watch?v=dX3k_QDnzHE"),
    ).toEqual({
      kind: "track",
      id: "dX3k_QDnzHE",
    });
    expect(
      parseYouTubeLink("https://www.youtube.com/watch?v=dX3k_QDnzHE"),
    ).toEqual({
      kind: "track",
      id: "dX3k_QDnzHE",
    });
    expect(parseYouTubeLink("https://youtu.be/dX3k_QDnzHE")).toEqual({
      kind: "track",
      id: "dX3k_QDnzHE",
    });
    expect(
      parseYouTubeLink(
        "https://music.youtube.com/playlist?list=PL1234567890abcdef",
      ),
    ).toEqual({
      kind: "playlist",
      id: "PL1234567890abcdef",
    });
    expect(
      parseYouTubeLink("https://otherdomain.com/watch?v=dX3k_QDnzHE"),
    ).toBeNull();
    expect(parseYouTubeLink("not a url")).toBeNull();
  });
});
