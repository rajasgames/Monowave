# Changelog

All notable changes to this project will be documented in this file.

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
