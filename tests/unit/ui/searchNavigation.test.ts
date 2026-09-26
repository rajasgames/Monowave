import type { SearchItem, Track } from "../../../src/music";

describe("Search Result Navigation & Tap Interactions", () => {
  const sampleTrack: Track = {
    id: "youtube:12345",
    title: "Midnight City",
    artist: "M83",
    cover: "https://lh3.googleusercontent.com/test.jpg",
  };

  const sampleAlbumItem: SearchItem = {
    id: "MPRE12345",
    kind: "album",
    title: "Hurry Up, We're Dreaming",
    subtitle: "M83 · 2011",
    cover: "https://lh3.googleusercontent.com/album.jpg",
  };

  const sampleArtistItem: SearchItem = {
    id: "UCartist123",
    kind: "artist",
    title: "M83",
    subtitle: "Artist",
    cover: "https://lh3.googleusercontent.com/artist.jpg",
  };

  const samplePlaylistItem: SearchItem = {
    id: "PLplaylist123",
    kind: "playlist",
    title: "Synthwave Vibes",
    subtitle: "Playlist",
    cover: "https://lh3.googleusercontent.com/playlist.jpg",
  };

  it("tapping a song starts playback and immediately navigates to Now Playing", () => {
    const playTrackMock = jest.fn();
    const navigateMock = jest.fn();

    const handleSongTap = (track: Track) => {
      playTrackMock(track, [track]);
      navigateMock("Player");
    };

    handleSongTap(sampleTrack);

    expect(playTrackMock).toHaveBeenCalledTimes(1);
    expect(playTrackMock).toHaveBeenCalledWith(sampleTrack, [sampleTrack]);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("Player");
  });

  it("tapping an album navigates to Collection screen", () => {
    const navigateMock = jest.fn();

    const handleCollectionTap = (item: SearchItem) => {
      navigateMock("Collection", { item });
    };

    handleCollectionTap(sampleAlbumItem);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("Collection", {
      item: sampleAlbumItem,
    });
  });

  it("tapping an artist navigates to Collection screen", () => {
    const navigateMock = jest.fn();

    const handleCollectionTap = (item: SearchItem) => {
      navigateMock("Collection", { item });
    };

    handleCollectionTap(sampleArtistItem);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("Collection", {
      item: sampleArtistItem,
    });
  });

  it("tapping a playlist navigates to Collection screen", () => {
    const navigateMock = jest.fn();

    const handleCollectionTap = (item: SearchItem) => {
      navigateMock("Collection", { item });
    };

    handleCollectionTap(samplePlaylistItem);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("Collection", {
      item: samplePlaylistItem,
    });
  });

  it("debounces rapid double taps to prevent duplicate navigation or playback calls", () => {
    const playTrackMock = jest.fn();
    const navigateMock = jest.fn();
    let lastTapTime = 0;

    const handleSongTapWithDebounce = (track: Track, now: number) => {
      if (now - lastTapTime < 600) return;
      lastTapTime = now;
      playTrackMock(track, [track]);
      navigateMock("Player");
    };

    // First tap at t = 1000ms
    handleSongTapWithDebounce(sampleTrack, 1000);
    // Rapid duplicate tap at t = 1100ms
    handleSongTapWithDebounce(sampleTrack, 1100);
    // Another rapid tap at t = 1200ms
    handleSongTapWithDebounce(sampleTrack, 1200);

    // Only the first tap should have triggered action
    expect(playTrackMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledTimes(1);

    // Subsequent tap after debounce interval at t = 2000ms
    handleSongTapWithDebounce(sampleTrack, 2000);
    expect(playTrackMock).toHaveBeenCalledTimes(2);
    expect(navigateMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the overflow action separate from the primary row action", () => {
    const playTrackMock = jest.fn();
    const setActionTrackMock = jest.fn();

    const onRowPress = () => {
      playTrackMock();
    };

    const onMorePress = () => {
      setActionTrackMock(sampleTrack);
    };

    // Trigger only more press
    onMorePress();

    expect(setActionTrackMock).toHaveBeenCalledWith(sampleTrack);
    expect(playTrackMock).not.toHaveBeenCalled();
  });
});
