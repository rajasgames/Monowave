# Troubleshooting

### Playback Stalls or Fails Immediately

This can happen if the NewPipe Extractor encounters age-restricted or geo-restricted content, or if YouTube recently changed their API. Ensure you are running the latest version of Monowave.

### Build Fails (React Native)

If `npm run android` fails:

1. Ensure your Android SDK and NDK paths are set properly.
2. Try wiping your Gradle cache.
3. If dependencies clash, run `npm run prebuild:android --clean` to regenerate the `android/` directory and re-apply all native plugins.

### UI Overlap

If components look cut off or overlapped on modern Android devices with edge-to-edge screens, verify that the `expo-system-ui` and SafeArea configurations are set properly in `app.json`.
