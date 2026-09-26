import { parseLink } from "../../../src/music";

describe("parseLink", () => {
  it("should parse a YouTube video URL", () => {
    const result = parseLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toEqual({ kind: "track", id: "dQw4w9WgXcQ" });
  });

  it("should parse a youtu.be short URL", () => {
    const result = parseLink("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toEqual({ kind: "track", id: "dQw4w9WgXcQ" });
  });

  it("should parse a YouTube Music video URL", () => {
    const result = parseLink("https://music.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toEqual({ kind: "track", id: "dQw4w9WgXcQ" });
  });

  it("should parse a playlist URL", () => {
    const result = parseLink("https://www.youtube.com/playlist?list=PLabc123");
    expect(result).toEqual({ kind: "playlist", id: "PLabc123" });
  });

  it("should prioritize list if URL contains both list and video id", () => {
    const result = parseLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc123");
    expect(result).toEqual({ kind: "playlist", id: "PLabc123" });
  });

  it("should return null for malformed URLs", () => {
    expect(parseLink("not-a-url")).toBeNull();
    expect(parseLink("")).toBeNull();
  });

  it("should return null for unrelated host", () => {
    expect(parseLink("https://vimeo.com/123456")).toBeNull();
    expect(parseLink("https://spotify.com/track/123")).toBeNull();
  });

  it("should return null for invalid video id", () => {
    expect(parseLink("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(parseLink("https://www.youtube.com/watch?v=toolongvideo")).toBeNull();
  });
});
