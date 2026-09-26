# Architecture

Monowave uses a strict local-first architecture.

## UI Layer (React Native)

- Screens: Independent UI components mounted in a Tab / Stack Navigator.
- Theme: Centralized tokens and a glassmorphic aesthetic defined in `ui/theme.ts`.
- State: Global state is handled by `PlayerContext.tsx` which proxies a Zustand store for synchronous UI updates.

## Playback Layer

- **PlaybackEngine**: Coordinates `expo-audio` state, locks, and UI events.
- **StreamResolver**: Fetches valid stream URLs right before playback using the native `StreamExtractorModule`.

## Native Module

- **StreamExtractorModule**: A Kotlin Expo Native Module that wraps the NewPipe Extractor to directly extract YouTube streams locally on the device without intermediary servers.
