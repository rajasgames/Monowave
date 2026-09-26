import {
  selectLargestThumbnail,
  normalizeArtworkUrl,
} from "../../../src/ui/utils";

describe("Artwork & Thumbnail Quality", () => {
  describe("selectLargestThumbnail", () => {
    it("selects the thumbnail with the largest dimensions even if not last in array", () => {
      const choices = [
        {
          url: "https://lh3.googleusercontent.com/small.jpg",
          width: 60,
          height: 60,
        },
        {
          url: "https://lh3.googleusercontent.com/largest.jpg",
          width: 544,
          height: 544,
        },
        {
          url: "https://lh3.googleusercontent.com/medium.jpg",
          width: 226,
          height: 226,
        },
      ];

      expect(selectLargestThumbnail(choices)).toBe(
        "https://lh3.googleusercontent.com/largest.jpg",
      );
    });

    it("falls back to last valid element when dimensions are omitted", () => {
      const choices = [
        { url: "https://lh3.googleusercontent.com/first.jpg" },
        { url: "https://lh3.googleusercontent.com/last.jpg" },
      ];

      expect(selectLargestThumbnail(choices)).toBe(
        "https://lh3.googleusercontent.com/last.jpg",
      );
    });

    it("handles empty or invalid inputs gracefully", () => {
      expect(selectLargestThumbnail([])).toBeUndefined();
      expect(selectLargestThumbnail(null)).toBeUndefined();
      expect(selectLargestThumbnail(undefined)).toBeUndefined();
      expect(
        selectLargestThumbnail([{ url: "" }, { url: "   " }]),
      ).toBeUndefined();
    });
  });

  describe("normalizeArtworkUrl", () => {
    it("replaces Google User Content dimension params with target rendered resolution", () => {
      const input = "https://lh3.googleusercontent.com/xyz123=w60-h60-l90-rj";
      const normalized = normalizeArtworkUrl(input, 100, 2);
      expect(normalized).toBe(
        "https://lh3.googleusercontent.com/xyz123=w200-h200-l90-rj",
      );
    });

    it("replaces ggpht size params with target rendered resolution", () => {
      const input =
        "https://yt3.ggpht.com/channel_icon=s88-c-k-c0x00ffffff-no-rj";
      const normalized = normalizeArtworkUrl(input, 64, 3);
      expect(normalized).toBe("https://yt3.ggpht.com/channel_icon=s192-c");
    });

    it("upgrades YouTube video default thumbnails to hqdefault for sharp display", () => {
      const input = "https://i.ytimg.com/vi/dX3k_QDnzHE/mqdefault.jpg";
      const normalized = normalizeArtworkUrl(input, 120, 2);
      expect(normalized).toBe(
        "https://i.ytimg.com/vi/dX3k_QDnzHE/hqdefault.jpg",
      );
    });

    it("rejects base64 data URLs to prevent storing heavy/unsupported images", () => {
      const input =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      expect(normalizeArtworkUrl(input)).toBeUndefined();
    });

    it("rejects blob and ephemeral stream URLs", () => {
      expect(
        normalizeArtworkUrl("blob:https://music.youtube.com/12345"),
      ).toBeUndefined();
      expect(
        normalizeArtworkUrl(
          "https://rr3---sn.googlevideo.com/videoplayback?expire=123",
        ),
      ).toBeUndefined();
    });

    it("returns regular URLs unmodified", () => {
      const input = "https://images.example.com/album.png";
      expect(normalizeArtworkUrl(input, 50)).toBe(input);
    });
  });
});
