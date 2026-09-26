# MONOWAVE IMPLEMENTATION CHECKLIST

Baseline: `rajasgames/Monowave@4d02ba84d2513760332de54abc69b6349809a924`

## P0

- [x] Add proper `.gitignore`
- [x] Remove tracked `.expo`
- [x] Choose CNG/prebuild as source of truth
- [x] Stop tracking generated root `/android`
- [x] Keep local module Android source committed
- [x] Resolve Expo Doctor dependency findings
- [x] Add lint/format/test/doctor scripts
- [x] Add Node version pin
- [x] Align version to planned v1.0.0
- [x] Choose permanent Android package id
- [x] Add full GPL license
- [x] Add COPYRIGHT
- [x] Add THIRD_PARTY_NOTICES.md
- [x] Implement `modules/stream-extractor/android/build.gradle`
- [x] Implement Android manifest for local module
- [x] Implement `StreamExtractorDownloader.kt`
- [x] Implement `StreamExtractorModule.kt`
- [x] Add structured native result types
- [x] Confirm module name = `MonowaveExtractor`
- [x] Confirm autolinking
- [x] Clean prebuild
- [x] Gradle assembleDebug
- [x] Real Android stream resolve
- [x] Real Android playback
- [x] Background playback
- [x] Lock-screen controls
- [x] Prevent rapid-tap overlap

## Architecture

- [x] Add domain `Track`
- [x] Add `ResolvedStream`
- [x] Add structured `AppError`
- [x] Split HTTP client
- [x] Split YouTube provider client
- [x] Split provider parser
- [x] Add parser fixtures
- [x] Add `MusicCatalog`
- [x] Add `StreamSource`
- [x] Add `StreamResolver`
- [x] Add in-memory stream expiry cache
- [x] Add resolve de-duplication
- [x] Extract `PlaybackEngine`
- [x] Extract pure queue functions
- [x] Add storage repository
- [x] Add storage schema version
- [x] Add migrations
- [x] Preserve recommendation modules

## UI

- [x] Move design tokens out of `App.tsx`
- [x] Move utilities out of `App.tsx`
- [x] Extract common components
- [x] Extract `TrackRow`
- [x] Extract recommendation components
- [x] Extract mini-player
- [x] Create Home screen
- [x] Create Search screen
- [x] Create Library screen
- [x] Create History screen
- [x] Create Settings screen
- [x] Create Now Playing screen
- [x] Create Playlist screen
- [x] Create Collection screen
- [x] Add navigation
- [x] Android back behavior verified
- [x] Virtualize long lists
- [x] Accessibility labels
- [x] Touch targets
- [x] Empty/loading/error states

## Tests

- [x] Queue tests
- [x] Shuffle/repeat tests
- [x] URL parser tests
- [x] YouTube parser fixture tests
- [x] Error mapping tests
- [x] Storage migration tests
- [x] Recommendation scoring tests
- [x] Recommendation diversity tests
- [x] Stream expiry tests
- [x] Stream resolver integration tests
- [x] Storage integration tests
- [x] Playback controller tests
- [x] Critical component tests
- [x] Android smoke/E2E flow

## CI/release

- [x] GitHub Actions JS quality job
- [x] Expo integrity job
- [x] Android clean-build job
- [x] Dependabot
- [x] Branch protection requirements
- [x] CHANGELOG.md
- [x] README rewrite
- [x] BUILDING.md
- [x] ARCHITECTURE.md
- [x] PLAYBACK.md
- [x] RECOMMENDATIONS.md
- [x] PRIVACY.md
- [x] RELEASE.md
- [x] TROUBLESHOOTING.md
- [x] Version consistency check
- [x] Signed AAB release
- [x] APK smoke build
- [x] Checksums
- [x] Release notes
