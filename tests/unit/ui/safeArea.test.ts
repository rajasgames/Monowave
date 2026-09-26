describe("Android Safe Area & Layout Geometry", () => {
  describe("Bottom Tab Bar and MiniPlayer Geometry", () => {
    const baseTabHeight = 56;
    const miniPlayerShellHeight = 66;
    const miniPlayerGapAboveTabBar = 10; // in the 8-12dp range

    const calculateTabBarHeight = (bottomInset: number) => {
      return baseTabHeight + bottomInset;
    };

    const calculateMiniPlayerBottom = (bottomInset: number) => {
      const tabHeight = calculateTabBarHeight(bottomInset);
      return tabHeight + miniPlayerGapAboveTabBar;
    };

    const calculateScrollBottomPadding = (
      bottomInset: number,
      hasMiniPlayer: boolean,
      isModal: boolean = false,
    ) => {
      if (isModal) {
        return hasMiniPlayer ? 96 + bottomInset : 32 + bottomInset;
      }
      return hasMiniPlayer ? 152 + bottomInset : 84 + bottomInset;
    };

    it("correctly positions tab bar and mini-player with Gesture Navigation (24dp inset)", () => {
      const gestureInset = 24;
      const tabHeight = calculateTabBarHeight(gestureInset);
      const miniPlayerBottom = calculateMiniPlayerBottom(gestureInset);

      expect(tabHeight).toBe(80);
      expect(miniPlayerBottom).toBe(90);
      expect(miniPlayerBottom - tabHeight).toBe(10); // Exactly 10dp above tab bar (8-12dp range)

      const paddingWithMiniPlayer = calculateScrollBottomPadding(
        gestureInset,
        true,
      );
      const paddingWithoutMiniPlayer = calculateScrollBottomPadding(
        gestureInset,
        false,
      );

      // Ensures clearance above mini-player (80 + 10 + 66 = 156 top of miniplayer, padding is 176 -> 20dp clearance)
      expect(paddingWithMiniPlayer).toBe(176);
      expect(paddingWithMiniPlayer).toBeGreaterThan(
        miniPlayerBottom + miniPlayerShellHeight,
      );

      // Ensures clearance above tab bar when no mini-player (80 top of tab bar, padding is 108 -> 28dp clearance)
      expect(paddingWithoutMiniPlayer).toBe(108);
      expect(paddingWithoutMiniPlayer).toBeGreaterThan(tabHeight);
    });

    it("correctly positions tab bar and mini-player with 3-Button Navigation (48dp inset)", () => {
      const threeButtonInset = 48;
      const tabHeight = calculateTabBarHeight(threeButtonInset);
      const miniPlayerBottom = calculateMiniPlayerBottom(threeButtonInset);

      expect(tabHeight).toBe(104);
      expect(miniPlayerBottom).toBe(114);
      expect(miniPlayerBottom - tabHeight).toBe(10);

      const paddingWithMiniPlayer = calculateScrollBottomPadding(
        threeButtonInset,
        true,
      );
      const paddingWithoutMiniPlayer = calculateScrollBottomPadding(
        threeButtonInset,
        false,
      );

      // Clearance check with 3-button nav
      expect(paddingWithMiniPlayer).toBe(200);
      expect(paddingWithMiniPlayer).toBeGreaterThan(
        miniPlayerBottom + miniPlayerShellHeight,
      );

      expect(paddingWithoutMiniPlayer).toBe(132);
      expect(paddingWithoutMiniPlayer).toBeGreaterThan(tabHeight);
    });
  });

  describe("Responsive Now Playing Artwork Calculation", () => {
    const computeResponsiveArtSize = (
      screenWidth: number,
      screenHeight: number,
    ) => {
      return Math.min(
        Math.max(screenWidth - 64, 180),
        Math.min(screenHeight * 0.36, 320),
      );
    };

    it("scales artwork down on compact/small Android screens (360x640) without overflowing", () => {
      const smallScreenWidth = 360;
      const smallScreenHeight = 640;
      const size = computeResponsiveArtSize(
        smallScreenWidth,
        smallScreenHeight,
      );

      // 640 * 0.36 = 230.4
      expect(size).toBeCloseTo(230.4, 1);
      expect(size).toBeLessThan(310); // Responsive instead of fixed 310dp
      expect(size).toBeGreaterThanOrEqual(180);
    });

    it("caps artwork at max 320dp on standard / larger Android screens (412x915)", () => {
      const width = 412;
      const height = 915;
      const size = computeResponsiveArtSize(width, height);

      // 412 - 64 = 348, 915 * 0.36 = 329.4 -> min with 320 = 320
      expect(size).toBe(320);
    });
  });
});
