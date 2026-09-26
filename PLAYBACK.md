# Playback System

Monowave relies on `expo-audio` paired with our custom `PlaybackEngine` and `StreamResolver`.

## Lifecycle
1. User taps "Play".
2. `PlaybackEngine` sets the player state to "loading".
3. `StreamResolver` calls the native `StreamExtractorModule.resolve()`.
4. The Kotlin module queries NewPipe, selects the best progressive HTTP audio stream, and returns it to JS.
5. `player.replace()` is called on `expo-audio` with the resolved stream URL.
6. `expo-audio` handles background playback, lock-screen controls (`setActiveForLockScreen`), and audio interruptions.
