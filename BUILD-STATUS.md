# Build verification — 2026-09-24

## Completed

1. Dependencies installed successfully with `npm install --ignore-scripts --no-audit --no-fund`. Installation lifecycle scripts were not exercised.
2. `npm run check` completed with exit code 0.
3. `EXPO_OFFLINE=1 CI=1 npm run check:dependencies` completed with exit code 0. The online check hit an HTTP proxy timeout; the offline check uses the installed Expo compatibility data and is not a live service check.
4. `npm run check:native` detected `@monowave/stream-extractor` and `com.monowave.extractor.StreamExtractorModule`.
5. `EXPO_OFFLINE=1 CI=1 npm run prebuild:android -- --clean` completed with exit code 0.
6. Generated Gradle files contain a single JitPack repository and core library desugaring. The generated Android manifest contains `AudioControlsService` with media playback foreground service support.
7. `EXPO_OFFLINE=1 CI=1 npm run export:android -- --output-dir .build-cache/android-export` bundled 608 modules and produced a Hermes bundle, exit code 0.
8. Git ignore matching verified both `.gitignore` and `.easignore`: root Android output is ignored, native extractor source and package-lock.json are retained.
9. Lockfile root dependency specifications match package.json.

## Remaining validation

- Native Gradle compilation, including downloading and compiling NewPipe's dependency graph.
- Installation and playback tests on a physical Android device or emulator.
- EAS cloud APK build after linking this project to the owner's Expo account.

There is no APK in this source archive. Generated Android code, exported bundles, dependencies, build caches, and signing files are excluded. They are reproducible through the documented build commands.
