# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-09-27

### Added

- Granular domain controllers and state contexts (`usePlaybackController`, `useQueueController`, `useLibraryController`, `usePreferencesController`) preventing 500ms playback position ticks from triggering re-renders across the app.
- Repository layer (`LibraryRepository`, `SearchHistoryRepository`, `PreferencesRepository`) with versioned schema envelopes and non-destructive corruption recovery.
- Automatic 1-time stream URL recovery: invalidates expired media tokens and refreshes streams automatically when encountering 403 or playback failures.
- Expo config plugin (`withReleaseSigning.js`) and Gradle security rules enforcing dedicated production signing, preventing accidental debug-key public releases.
- Universal APK build generation (`monowave-universal.apk`) and automated `SHA256SUMS.txt` cryptographic verification in GitHub Actions release pipeline.
- 4 new unit test suites covering search history, preferences, stream resolver retry, and playback engine retry (105 tests across 19 suites).
- HomeScreen cold-start discovery guidance card, collection shortcuts, and categorized Settings screen with data reset controls.

### Fixed

- Eliminated unhandled crashes when local storage contains malformed or corrupted JSON.
- Resolved rapid-tap race conditions using generation counters and `AbortController` cancellation in `PlaybackEngine`.
- Fixed version drift between `package.json`, `app.json`, `versionCode`, and Git release tags.

## [1.0.6] - 2026-09-26

### Added

- Fluid micro-animations across all screens (spring scaling on buttons, track rows, discovery rails, and cards)
- Animated equalizer component (`AnimatedWaveform`) running on native animation drivers for active queue playback and mini-player badges
- Ambient breathing artwork pulse animation on the Now Playing screen during active playback
- High-resolution thumbnail selection and normalization across YouTube Music image endpoints
- Comprehensive unit test suites for UI safe areas, artwork normalization, search handling, and navigation

### Fixed

- Bottom tab bar Android ripple: replaced harsh rectangular ripple with soft, bounded circular ripple and active tab indicator
- Edge-to-edge Android navigation bar and status bar safe areas across all screens, modals, and mini-player
- Search input 400ms debouncing, request cancellation via `AbortController`, and race condition prevention
- Consistent mini-player spacing above navigation bar for both gesture navigation and 3-button navigation

## [1.0.0] - 2026-09-26

### Added

- Complete rewrite of the app using Expo and React Native
- Local-first architecture (SQLite/AsyncStorage)
- On-device recommendation engine (Discover Mix)
- Native Android stream extraction via NewPipe (StreamExtractorModule)
- Seamless background and lock-screen playback (`expo-audio`)
- Custom UI system (MonoTheme) with dynamic color extraction
- Search with debouncing, history, and offline mode
- Playlist import with deduplication and chunking

### Removed

- Legacy external backend dependency
- Legacy Firebase integration
