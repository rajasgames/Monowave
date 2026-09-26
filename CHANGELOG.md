# Changelog

All notable changes to this project will be documented in this file.

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
