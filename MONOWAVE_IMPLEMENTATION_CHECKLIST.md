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
- [ ] Add full GPL license
- [ ] Add COPYRIGHT
- [ ] Add THIRD_PARTY_NOTICES.md
- [ ] Implement `modules/stream-extractor/android/build.gradle`
- [ ] Implement Android manifest for local module
- [ ] Implement `StreamExtractorDownloader.kt`
- [ ] Implement `StreamExtractorModule.kt`
- [ ] Add structured native result types
- [ ] Confirm module name = `MonowaveExtractor`
- [ ] Confirm autolinking
- [ ] Clean prebuild
- [ ] Gradle assembleDebug
- [ ] Real Android stream resolve
- [ ] Real Android playback
- [ ] Background playback
- [ ] Lock-screen controls
- [ ] Prevent rapid-tap overlap

## Architecture

- [ ] Add domain `Track`
- [ ] Add `ResolvedStream`
- [ ] Add structured `AppError`
- [ ] Split HTTP client
- [ ] Split YouTube provider client
- [ ] Split provider parser
- [ ] Add parser fixtures
- [ ] Add `MusicCatalog`
- [ ] Add `StreamSource`
- [ ] Add `StreamResolver`
- [ ] Add in-memory stream expiry cache
- [ ] Add resolve de-duplication
- [ ] Extract `PlaybackEngine`
- [ ] Extract pure queue functions
- [ ] Add storage repository
- [ ] Add storage schema version
- [ ] Add migrations
- [ ] Preserve recommendation modules

## UI

- [ ] Move design tokens out of `App.tsx`
- [ ] Move utilities out of `App.tsx`
- [ ] Extract common components
- [ ] Extract `TrackRow`
- [ ] Extract recommendation components
- [ ] Extract mini-player
- [ ] Create Home screen
- [ ] Create Search screen
- [ ] Create Library screen
- [ ] Create History screen
- [ ] Create Settings screen
- [ ] Create Now Playing screen
- [ ] Create Playlist screen
- [ ] Create Collection screen
- [ ] Add navigation
- [ ] Android back behavior verified
- [ ] Virtualize long lists
- [ ] Accessibility labels
- [ ] Touch targets
- [ ] Empty/loading/error states

## Tests

- [ ] Queue tests
- [ ] Shuffle/repeat tests
- [ ] URL parser tests
- [ ] YouTube parser fixture tests
- [ ] Error mapping tests
- [ ] Storage migration tests
- [ ] Recommendation scoring tests
- [ ] Recommendation diversity tests
- [ ] Stream expiry tests
- [ ] Stream resolver integration tests
- [ ] Storage integration tests
- [ ] Playback controller tests
- [ ] Critical component tests
- [ ] Android smoke/E2E flow

## CI/release

- [ ] GitHub Actions JS quality job
- [ ] Expo integrity job
- [ ] Android clean-build job
- [ ] Dependabot
- [ ] Branch protection requirements
- [ ] CHANGELOG.md
- [ ] README rewrite
- [ ] BUILDING.md
- [ ] ARCHITECTURE.md
- [ ] PLAYBACK.md
- [ ] RECOMMENDATIONS.md
- [ ] PRIVACY.md
- [ ] RELEASE.md
- [ ] TROUBLESHOOTING.md
- [ ] Version consistency check
- [ ] Signed AAB release
- [ ] APK smoke build
- [ ] Checksums
- [ ] Release notes
