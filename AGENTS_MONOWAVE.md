# AGENTS.md — Monowave

Read `MONOWAVE_REBUILD_SPEC.md` before editing.

## Mission

Bring Monowave to a source-complete, reproducible Android v1.0.0 while preserving its local-first recommendations and dark music-first product identity.

## Hard rules

1. Use Expo CNG/prebuild as native-project source of truth.
2. Root `/android` is generated; custom authored Android code belongs in `modules/stream-extractor/android`.
3. Never document a feature as working unless the committed source and executed tests/builds prove it.
4. Never claim playback is fixed until `MonowaveExtractor` autolinks, Android compiles, a real track resolves, and `expo-audio` plays it.
5. Do not rewrite the entire app at once.
6. Keep external/provider data behind typed parser boundaries.
7. Expected failures use structured errors.
8. Do not persist signed/temporary stream URLs.
9. Do not weaken TypeScript or silence diagnostics to force green checks.
10. Preserve user library/history/recommendation data through migrations.
11. No analytics, accounts, or cloud sync by default.
12. Never commit signing material, secrets, `.expo`, or generated root native projects.

## Phase order

1. Build/repository hygiene
2. Native extractor
3. Domain types
4. Catalog/provider refactor
5. Stream resolver
6. Playback engine
7. Storage/migrations
8. Navigation/UI split
9. Tests
10. CI
11. Documentation/licensing
12. v1 release

Do the earliest incomplete phase first.

## Required validation

After every phase:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:ci
npm run doctor
npm run check:dependencies
npm run check:native:verify
npm run export:android
```

For native changes:

```bash
npx expo prebuild --clean --platform android --no-install
cd android
./gradlew assembleDebug
```

## Completion report

Always finish a phase with:

```text
Phase:
Commit/branch:
Files added:
Files modified:
Files deleted:
Behavior changed:
Tests added:
Commands run:
Passing gates:
Remaining failures:
Known risks:
Next phase:
```

Do not state a command passed unless it was actually executed successfully.
