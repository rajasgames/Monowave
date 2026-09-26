# MONOWAVE REBUILD SPECIFICATION

**Document purpose:** Implementation-grade blueprint for rebuilding and hardening Monowave so an AI coding agent can execute the work without inventing architecture, acceptance criteria, or release policy.

**Repository:** `rajasgames/Monowave`  
**Baseline reviewed:** `main` at commit `4d02ba84d2513760332de54abc69b6349809a924`  
**Baseline date:** 2026-09-26  
**Target release:** `v1.0.0` source-complete Android release  
**Primary platform:** Android  
**Framework:** React Native + Expo SDK 57  
**Language:** TypeScript + Kotlin  
**License target:** GPL-3.0-or-later

---

# 1. Executive Objective

Rebuild Monowave from a promising prototype into a source-complete, reproducible, maintainable, testable, privacy-respecting Android music player.

The rebuild MUST preserve Monowave's strongest differentiators:

- dark, music-first visual identity;
- local-first library and listening history;
- recommendation engine based on local behavior;
- no mandatory account;
- no mandatory backend;
- ad-free product direction;
- direct Android playback with background/lock-screen controls;
- YouTube Music discovery/import functionality where technically available.

The rebuild MUST remove the current structural weaknesses:

- incomplete native stream extractor;
- `App.tsx` acting as the application, navigation, screen layer, component library, and interaction controller at once;
- no automated tests;
- no CI;
- weak parser typing;
- no formal error taxonomy;
- version inconsistency;
- incomplete license distribution;
- generated Expo cache committed to source;
- conflicting native/prebuild workflow;
- placeholder Android application id;
- insufficient release verification;
- README claims that are stronger than the committed source can currently prove.

The finished repository should be buildable by a new contributor or CI runner from a clean clone using documented commands.

---

# 2. Non-Negotiable Engineering Rules

The coding agent MUST follow these rules for the entire rebuild.

## 2.1 Source completeness

A feature documented as working MUST be represented by committed source.

Do not document playback as working until:

1. the Kotlin extractor implementation exists;
2. Expo autolinking detects it;
3. Android compiles it;
4. JavaScript can call it;
5. a real track can resolve;
6. `expo-audio` can play the returned stream;
7. background playback and lock-screen controls are verified.

No release may contain a JavaScript bridge pointing at a native class that does not exist.

## 2.2 One native workflow

Use **Continuous Native Generation / Expo Prebuild** as the source of truth.

Repository source of truth:

- `app.json`;
- config plugins in `plugins/`;
- local native module in `modules/stream-extractor/`;
- TypeScript application source.

Generated root native directories such as `/android` SHOULD NOT be committed.

The local module's own `modules/stream-extractor/android/` directory MUST be committed because that is authored source, not generated project output.

CI must prove that:

```bash
npx expo prebuild --clean --platform android --no-install
```

recreates a usable Android project.

## 2.3 No hidden runtime dependencies

No feature may rely on an undocumented developer machine state.

Do not require:

- globally installed Expo CLI;
- globally installed EAS CLI;
- manual Gradle edits after prebuild;
- manually copied Kotlin files;
- untracked `.env` values for core playback;
- pre-existing generated native directories.

## 2.4 Typed boundaries

Any external or unstable data source MUST be normalized before entering the app domain.

The following boundaries require explicit types:

- YouTube Music HTTP responses;
- native extractor responses;
- storage payloads;
- recommendation events;
- playback errors;
- resolver output.

`any` may exist only inside a parser boundary when unavoidable, and MUST NOT escape that file.

## 2.5 Errors are data

Expected failures MUST use structured errors, not arbitrary strings.

The UI should never need to parse an English message to determine what happened.

## 2.6 Local-first privacy

Likes, playlists, listening history, recommendation profiles, and queue state stay on-device by default.

Do not introduce analytics, telemetry, accounts, or cloud sync in v1.0 unless explicitly opt-in and separately approved.

## 2.7 No false release claims

README, screenshots, badges, and release notes MUST describe the behavior actually verified on the release commit.

---

# 3. Current Baseline Problems

The agent should treat these as confirmed baseline defects.

## 3.1 Native playback blocker — P0

Current module:

```text
modules/stream-extractor/
├── expo-module.config.json
├── index.ts
└── package.json
```

The module config references:

```text
com.monowave.extractor.StreamExtractorModule
```

The JavaScript bridge requires:

```text
MonowaveExtractor
```

But there is no committed:

- `android/build.gradle`;
- Android manifest;
- Kotlin module class;
- Kotlin downloader/network adapter;
- native implementation directory.

Therefore the central stream resolution path is incomplete.

## 3.2 Monolithic UI — P0/P1

`src/App.tsx` is approximately 1,131 lines and contains:

- type definitions;
- theme tokens;
- utility formatting;
- reusable UI components;
- search box;
- mini-player;
- bottom navigation;
- screen routing;
- screen content;
- dialogs/modals;
- application orchestration;
- a large style sheet.

This must be decomposed before adding significant features.

## 3.3 Weak build/repository hygiene — P0

Current issues include:

- `.expo` committed;
- generated root `android/` committed while prebuild/config-plugin workflow is also used;
- direct `expo-modules-core` dependency;
- `expo-asset` dependency mismatch reported by Expo diagnostics;
- no lint script;
- no format script;
- no test script;
- no CI;
- no build verification workflow.

## 3.4 Version/release inconsistency — P0

The repository tag/release intent is v1.0.0 while application metadata is currently `0.1.0`.

The following must agree for a release:

- `package.json`;
- `app.json`;
- local module package version when relevant;
- Android `versionCode`;
- Git tag;
- GitHub Release title.

## 3.5 Licensing is incomplete — P0

The existing `LICENSE` file is a short statement and link, not the full license text.

For v1.0, add:

- full GPL-3.0-or-later license text in `LICENSE`;
- `COPYRIGHT`;
- `THIRD_PARTY_NOTICES.md`;
- NewPipe Extractor attribution;
- dependency/license review before release.

## 3.6 Network/parser fragility — P1

`src/music.ts` currently:

- makes raw YouTube Music requests;
- uses a fixed web client context;
- returns `Promise<any>`;
- recursively searches untyped response trees;
- uses `any` throughout parser helpers;
- mixes transport, parser, domain mapping, and public service methods.

This must be separated into transport, schemas/guards, parser, and provider service.

---

# 4. Target Repository Architecture

The target structure is:

```text
Monowave/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── release.yml
│   └── dependabot.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── BUILDING.md
│   ├── PLAYBACK.md
│   ├── RECOMMENDATIONS.md
│   ├── PRIVACY.md
│   ├── RELEASE.md
│   └── TROUBLESHOOTING.md
├── modules/
│   └── stream-extractor/
│       ├── android/
│       │   ├── build.gradle
│       │   └── src/main/
│       │       ├── AndroidManifest.xml
│       │       └── java/com/monowave/extractor/
│       │           ├── StreamExtractorModule.kt
│       │           └── StreamExtractorDownloader.kt
│       ├── src/
│       │   ├── StreamExtractor.types.ts
│       │   └── StreamExtractorModule.ts
│       ├── expo-module.config.json
│       ├── index.ts
│       └── package.json
├── plugins/
│   ├── withCoreLibraryDesugaring.js
│   └── withJitPack.js
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── bootstrap.ts
│   ├── components/
│   │   ├── common/
│   │   ├── lists/
│   │   ├── player/
│   │   └── recommendations/
│   ├── core/
│   │   ├── errors.ts
│   │   ├── http.ts
│   │   ├── result.ts
│   │   └── types.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── types.ts
│   ├── playback/
│   │   ├── PlaybackEngine.ts
│   │   ├── queue.ts
│   │   ├── preload.ts
│   │   └── types.ts
│   ├── providers/
│   │   ├── catalog/
│   │   │   ├── MusicCatalog.ts
│   │   │   └── youtube/
│   │   │       ├── client.ts
│   │   │       ├── parser.ts
│   │   │       ├── types.ts
│   │   │       └── YouTubeMusicCatalog.ts
│   │   └── stream/
│   │       ├── NativeStreamSource.ts
│   │       ├── DirectStreamSource.ts
│   │       ├── StreamResolver.ts
│   │       └── types.ts
│   ├── recommendations/
│   │   ├── cache.ts
│   │   ├── dataSources.ts
│   │   ├── diversity.ts
│   │   ├── profile.ts
│   │   ├── recommendationService.ts
│   │   ├── scoring.ts
│   │   ├── signals.ts
│   │   ├── storage.ts
│   │   └── types.ts
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── NowPlayingScreen.tsx
│   │   ├── CollectionScreen.tsx
│   │   └── PlaylistScreen.tsx
│   ├── state/
│   │   ├── LibraryProvider.tsx
│   │   ├── PlayerProvider.tsx
│   │   └── RecommendationProvider.tsx
│   ├── storage/
│   │   ├── libraryRepository.ts
│   │   ├── migrations.ts
│   │   ├── schemas.ts
│   │   └── keys.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   └── utils/
│       ├── formatTime.ts
│       └── timeAgo.ts
├── tests/
│   ├── fixtures/
│   ├── unit/
│   └── integration/
├── .gitignore
├── AGENTS.md
├── CHANGELOG.md
├── COPYRIGHT
├── LICENSE
├── README.md
├── THIRD_PARTY_NOTICES.md
├── app.json
├── eas.json
├── index.ts
├── package.json
└── tsconfig.json
```

The exact filenames can change when justified, but the separation of responsibilities MUST remain.

---

# 5. Phase 0 — Repository Hygiene and Build Baseline

This phase must happen before feature work.

## Tasks

1. Add or repair `.gitignore`:
   - `.expo/`
   - generated `/android/`
   - generated `/ios/`
   - `node_modules/`
   - build output
   - local signing material
   - logs
   - `.env*` except approved examples.

2. Remove tracked `.expo` files from Git.

3. Remove the generated root `/android` project from Git if adopting CNG/prebuild.

4. Keep `modules/stream-extractor/android` committed.

5. Remove direct `expo-modules-core` from app dependencies unless Expo Doctor explicitly requires it for the selected SDK configuration.

6. Install the Expo-compatible `expo-asset` dependency if required by SDK diagnostics.

7. Add quality scripts:

```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo run:android",
    "prebuild:android": "expo prebuild --clean --platform android --no-install",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "format": "prettier --write .",
    "test": "jest",
    "test:ci": "jest --runInBand --ci",
    "doctor": "expo-doctor",
    "check:dependencies": "expo install --check",
    "check:native": "expo-modules-autolinking resolve --platform android",
    "check:native:verify": "expo-modules-autolinking verify",
    "export:android": "expo export --platform android"
  }
}
```

Names may differ, but equivalent gates are mandatory.

8. Add `.nvmrc` or `.node-version`.

9. Align `package.json` engines, EAS node version, and CI node version.

10. Choose a permanent Android application id.
    - Example: `com.rajasgames.monowave`.
    - Do not change an existing production package id if an app has already been distributed under another id.

## Acceptance gates

All must pass:

```bash
npm ci
npm run typecheck
npm run doctor
npm run check:dependencies
npm run check:native
npm run check:native:verify
npm run export:android
```

Expo Doctor target: **all checks passing**.

---

# 6. Phase 1 — Restore the Native Stream Extractor

This is the highest priority implementation task.

## 6.1 Required module structure

Create:

```text
modules/stream-extractor/android/build.gradle
modules/stream-extractor/android/src/main/AndroidManifest.xml
modules/stream-extractor/android/src/main/java/com/monowave/extractor/StreamExtractorModule.kt
modules/stream-extractor/android/src/main/java/com/monowave/extractor/StreamExtractorDownloader.kt
modules/stream-extractor/src/StreamExtractor.types.ts
modules/stream-extractor/src/StreamExtractorModule.ts
```

## 6.2 Gradle requirements

The local Android library MUST:

- use `com.android.library`;
- use `expo-module-gradle-plugin`;
- define the same namespace used in `expo-module.config.json`;
- enable core library desugaring if the pinned NewPipe version requires APIs above the app's minSdk;
- include a pinned, exact NewPipe Extractor version;
- include desugaring library version explicitly;
- avoid `+`, `latest`, branch snapshots, or unpinned dependency coordinates.

Initial known-good dependency baseline:

```text
com.github.TeamNewPipe:NewPipeExtractor:v0.26.5
```

Do not silently upgrade it during the v1.0 stabilization phase. Upgrade only in a dedicated PR with playback regression testing.

## 6.3 Native module contract

The JavaScript-visible native module name MUST exactly match the name required by TypeScript:

```text
MonowaveExtractor
```

The module MUST expose at least:

```ts
type NativeStreamSuccess = {
  ok: true;
  url: string;
  userAgent: string;
  mimeType?: string;
  bitrate?: number;
  durationSeconds?: number;
  title?: string;
  uploader?: string;
  expiresAt?: number;
  extractorVersion: string;
};

type NativeStreamFailureReason =
  | 'invalid_id'
  | 'network'
  | 'geo_restricted'
  | 'age_restricted'
  | 'paid_content'
  | 'private_content'
  | 'unavailable'
  | 'sign_in_required'
  | 'rate_limited'
  | 'unsupported'
  | 'live_stream'
  | 'no_audio_stream'
  | 'extraction_failed'
  | 'unknown';

type NativeStreamFailure = {
  ok: false;
  reason: NativeStreamFailureReason;
  message: string;
  exception?: string;
};

type NativeStreamResult = NativeStreamSuccess | NativeStreamFailure;
```

## 6.4 Kotlin behavior

`StreamExtractorModule.kt` MUST:

1. validate the supplied video id;
2. initialize NewPipe once and thread-safely;
3. perform extraction on an async/native worker path, never blocking the JS thread;
4. request the YouTube stream from NewPipe;
5. reject unsupported live streams for v1 unless explicitly implemented;
6. choose a playable audio stream compatible with `expo-audio`;
7. return the same user-agent used to obtain the stream when required;
8. return structured failures instead of throwing expected extractor failures into JS;
9. avoid leaking full network responses or sensitive headers into logs.

The implementation SHOULD prefer progressive HTTP audio for the initial v1 because it reduces complexity. DASH/HLS may be added later only with playback tests.

## 6.5 Downloader

`StreamExtractorDownloader.kt` MUST:

- provide a deterministic user-agent;
- use timeouts;
- forward required request headers;
- support GET and HEAD as required by NewPipe;
- cap unexpected response sizes;
- convert transport failures into useful exceptions;
- avoid insecure TLS overrides;
- avoid accepting invalid certificates;
- never log authorization/cookie headers.

## 6.6 Stream URL lifetime

Google-hosted stream URLs can expire.

The TypeScript layer SHOULD:

1. inspect an `expire` query parameter when present;
2. otherwise use a conservative in-memory TTL;
3. refresh slightly before expiry;
4. never persist resolved stream URLs in AsyncStorage;
5. invalidate and resolve again after a playback 403/expired-source failure, once.

## 6.7 Autolinking verification

A build is not accepted because `expo-module.config.json` exists.

CI MUST confirm `MonowaveExtractor` appears in Expo autolinking resolution after a clean install/prebuild.

## Acceptance gates

- Native source exists.
- Autolinking detects the module.
- `./gradlew :app:assembleDebug` succeeds from a clean generated Android project.
- JS platform probe confirms native module availability.
- Real track resolves on Android.
- Real track plays.
- Invalid id returns structured `invalid_id`.
- Unavailable/private/region-restricted content maps to structured error categories.
- No native crash occurs for expected extraction failures.

---

# 7. Phase 2 — Introduce a Real Domain Model

Create `src/core/types.ts`.

Core entities should not be tied directly to a YouTube response shape.

Recommended model:

```ts
export type ProviderId = 'youtube';

export type Track = {
  id: string;                 // stable Monowave id, e.g. youtube:<videoId>
  provider: ProviderId;
  sourceId: string;           // raw provider id
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  artwork?: string;
  durationSeconds?: number;
};

export type Playlist = {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
};

export type HistoryEntry = {
  id: string;
  track: Track;
  startedAt: number;
  completed?: boolean;
  listenedSeconds?: number;
};

export type ResolvedStream = {
  url: string;
  userAgent?: string;
  mimeType?: string;
  bitrate?: number;
  expiresAt: number;
  resolvedBy: string;
};
```

Rules:

- `Track.id` must be globally unambiguous across providers.
- provider-specific raw ids stay in `sourceId`.
- do not store ephemeral playback URL in `Track`.
- UI components consume domain types, not raw provider JSON.
- recommendation engine consumes domain data only.

---

# 8. Phase 3 — Split the YouTube Music Catalog Layer

Replace the current mixed `src/music.ts` design.

## 8.1 Transport layer

Create `src/core/http.ts` with one reusable client.

Requirements:

- timeout via `AbortController`;
- caller-provided abort signal;
- bounded retry policy for idempotent network failures;
- no retries for clear 4xx failures except specifically documented transient statuses;
- JSON parsing error classification;
- response size safeguards where practical;
- typed `HttpError`.

## 8.2 Provider client

Create:

```text
src/providers/catalog/youtube/client.ts
```

Responsibilities:

- build request URL;
- maintain provider context/header configuration;
- perform endpoint request through `core/http`;
- return unknown/raw JSON only to the parser boundary.

Do not mix this file with UI or domain state.

## 8.3 Parser boundary

Create:

```text
src/providers/catalog/youtube/parser.ts
src/providers/catalog/youtube/types.ts
```

Rules:

- raw provider response is `unknown`;
- helper guards narrow shapes;
- `any` is forbidden outside a tightly documented compatibility helper;
- cap recursive traversal;
- prevent recursive loops if object identity is reused;
- normalize tracks, artists, albums, and playlists into domain objects;
- parser failure for one malformed renderer must not discard the entire valid response.

## 8.4 Fixture tests

Store representative sanitized response fixtures in:

```text
tests/fixtures/youtube/
```

Tests MUST cover:

- search track;
- search artist;
- album;
- playlist;
- radio/related queue;
- missing artwork;
- missing duration;
- unknown renderer;
- changed/malformed nested shape;
- empty response.

The parser should be independently testable without network access.

## 8.5 Provider abstraction

Create:

```ts
export interface MusicCatalog {
  search(query: string, signal?: AbortSignal): Promise<SearchResult[]>;
  browse(id: string, signal?: AbortSignal): Promise<SearchResult[]>;
  getTrack(id: string, signal?: AbortSignal): Promise<Track>;
  getRadio(seed: Track, signal?: AbortSignal): Promise<Track[]>;
}
```

UI MUST depend on `MusicCatalog`, not on YouTube request functions directly.

---

# 9. Phase 4 — Build a Stream Resolver Layer

Do not call the native module directly from the React hook.

Create:

```text
src/providers/stream/types.ts
src/providers/stream/NativeStreamSource.ts
src/providers/stream/DirectStreamSource.ts
src/providers/stream/StreamResolver.ts
```

Contract:

```ts
export interface StreamSource {
  readonly id: string;
  canHandle(track: Track): boolean;
  resolve(track: Track, signal?: AbortSignal): Promise<ResolvedStream>;
}
```

Resolver responsibilities:

- select usable sources;
- cache short-lived resolved streams in memory only;
- deduplicate concurrent resolves for the same track;
- invalidate expired or failed streams;
- preserve error taxonomy;
- permit future provider implementations without changing playback engine.

Recommended resolver order for v1:

1. direct stream only when explicitly supplied by a trusted internal source;
2. native NewPipe Android source.

Do not ship a hard-coded third-party public endpoint list as a silent fallback. If remote resolver support is later added, make it explicit and user-configurable.

---

# 10. Phase 5 — Extract the Playback Engine

The current `useMonowave` mixes storage, player lifetime, playback, queue, history, recommendation signals, and UI state.

Replace this with a service-oriented player.

## 10.1 `PlaybackEngine`

Create `src/playback/PlaybackEngine.ts`.

Responsibilities:

- own the `expo-audio` player instance;
- configure audio mode once;
- resolve streams;
- replace player source;
- start/pause;
- seek;
- listen to playback status;
- expose normalized player state;
- activate/deactivate lock-screen controls;
- react to expired stream failures;
- record play completion and skip signals;
- maintain request-generation/cancellation state.

## 10.2 Race prevention

When the user rapidly taps tracks:

- pause current audio immediately;
- increment a load generation/token;
- abort or invalidate previous in-flight resolver request when possible;
- only apply the stream if its token is still current;
- discard stale resolution completions.

This rule is mandatory.

## 10.3 Lock-screen metadata

For the active track:

- title;
- artist;
- artwork if available;
- play/pause state;
- seek actions if supported.

Android background playback must remain active with screen locked.

## 10.4 Queue model

Move queue operations to `src/playback/queue.ts`.

Pure functions MUST cover:

- set queue;
- play index;
- enqueue;
- add next;
- remove;
- reorder;
- next;
- previous;
- repeat off/all/one;
- shuffle.

Do not bury queue mutation in React component code.

## 10.5 Shuffle

Avoid repeatedly selecting random indices independently because that can repeat the same track excessively.

Preferred behavior:

- create a shuffled play order;
- preserve current track;
- traverse the order;
- regenerate when exhausted depending on repeat mode.

## 10.6 Preloading

Add optional pre-resolution for the next track:

- never allow preload to delay current playback;
- deduplicate against active resolve;
- obey URL expiry;
- cap cache size;
- invalidate when queue changes.

## 10.7 Completion/skip signals

A completed track and a skipped track are distinct recommendation signals.

Define completion threshold explicitly, for example:

- `didJustFinish` from player, OR
- >= 90% listened when playback state indicates natural finish.

Do not count a natural auto-advance as a skip.

---

# 11. Phase 6 — Versioned Storage and Migrations

Keep local storage simple in v1.

AsyncStorage is acceptable if wrapped behind repositories.

## 11.1 Never read/write AsyncStorage throughout UI

Create:

```text
src/storage/libraryRepository.ts
src/storage/migrations.ts
src/storage/schemas.ts
src/storage/keys.ts
```

## 11.2 Storage envelope

Use:

```ts
type PersistedState<T> = {
  schemaVersion: number;
  savedAt: number;
  data: T;
};
```

## 11.3 Migration rules

- old state must never be spread blindly over new state;
- validate required arrays/fields;
- default missing values;
- migrate schema sequentially;
- preserve user data when possible;
- corrupted state should produce a recoverable diagnostic and fall back safely;
- keep a backup of the prior raw payload during destructive migration if practical.

## 11.4 Persist

Persist:

- profile/display name;
- liked tracks;
- playlists;
- history;
- queue ids/track metadata;
- current queue index;
- repeat;
- shuffle;
- relevant settings;
- recommendation profile/cache where appropriate.

Do NOT persist:

- current HTTP stream URL;
- extractor temporary response;
- transient loading flags;
- current `AudioPlayer` object;
- secrets or cookies.

---

# 12. Phase 7 — Preserve and Harden Recommendations

The recommendation subsystem is one of Monowave's strongest existing areas and should be preserved rather than replaced wholesale.

## 12.1 Keep module separation

Retain conceptual modules for:

- signals;
- profile;
- scoring;
- diversity;
- data sources;
- cache;
- storage;
- orchestration.

Move them under a single stable `src/recommendations/` boundary if desired.

## 12.2 Determinism

Given the same:

- library;
- history;
- signal store;
- provider candidates;
- clock value injected into calculation;

the scorer should produce deterministic output.

Inject time instead of calling `Date.now()` deep inside scoring logic when testing.

## 12.3 Explainable score

During development, recommendation candidates SHOULD expose debug metadata:

```ts
{
  totalScore,
  affinityScore,
  recencyScore,
  completionScore,
  skipPenalty,
  playlistSignal,
  diversityPenalty
}
```

This metadata is for diagnostics and tests, not necessarily user UI.

## 12.4 Cold start

When the user has insufficient history:

- use liked songs;
- use playlist contents;
- use recently played seeds;
- use provider radio/related results;
- display a truthful "recommendations improve as you listen" state.

Never fabricate personalization.

## 12.5 Diversity constraints

Tests should verify:

- artist repetition cap;
- repeated-track prevention;
- seed similarity;
- mix size;
- recent-history exclusion rules;
- duplicate provider id removal.

## 12.6 Recommendation tests

At minimum:

- completion raises affinity;
- early skip reduces affinity;
- playlist add is a positive signal;
- repeated skips outweigh one weak positive;
- diversity layer prevents one artist dominating the mix;
- cache invalidates when input fingerprint changes;
- corrupted recommendation cache safely resets.

---

# 13. Phase 8 — UI and Navigation Refactor

The visual identity may remain custom. The architecture must not.

## 13.1 Navigation

Use React Navigation native stack + bottom tabs unless there is a documented reason not to.

Primary tabs:

- Home;
- Search;
- Library;
- History.

Stack/detail screens:

- Now Playing;
- Settings;
- Collection;
- Playlist Detail.

Android hardware back behavior must be handled by the navigation system rather than a custom array inside the main app component.

## 13.2 Screen rule

A screen file SHOULD generally stay under approximately 300-400 lines.

If larger, extract:

- header;
- list section;
- dialog;
- bottom sheet;
- empty state;
- row;
- control panel.

## 13.3 Shared component library

Create reusable components:

- `Artwork`;
- `BrandHeader`;
- `ScreenHeader`;
- `SectionHeader`;
- `TrackRow`;
- `TrackRail`;
- `MiniPlayer`;
- `PlaybackControls`;
- `SeekBar`;
- `EmptyState`;
- `ErrorBanner`;
- `LoadingState`;
- `AddToPlaylistSheet`;
- `ConfirmDialog`.

## 13.4 Design tokens

Move hard-coded visual constants into `src/theme`.

Minimum tokens:

- background;
- surface;
- elevated surface;
- text primary;
- text secondary;
- accent;
- destructive;
- divider;
- radii;
- spacing scale;
- font sizes;
- touch sizes.

No screen should redefine the app's core colors.

## 13.5 Lists

Use virtualized list components for long:

- search results;
- history;
- liked songs;
- playlist tracks;
- queue.

Do not render hundreds of track rows in a plain `ScrollView`.

## 13.6 Accessibility

Required:

- meaningful accessibility labels for icon-only controls;
- minimum practical touch target around Android's recommended size;
- do not communicate state by color alone;
- support font scaling where layout permits;
- preserve readable contrast;
- announce loading/error states where appropriate;
- disabled controls must expose disabled semantics.

## 13.7 Motion

Animations must:

- not delay input response;
- not control business state;
- degrade cleanly with reduced-motion accessibility settings when supported.

---

# 14. Phase 9 — Search and Import UX

## Search

Requirements:

- trim queries;
- minimum useful query length or debounced request;
- cancel stale searches;
- keep results associated with the query that produced them;
- expose loading, empty, error, and retry states;
- recent search history is local;
- recommendation search signals should not count every keystroke.

Only commit a search signal when the user submits or chooses a result.

## Link import

`parseLink` should support explicitly documented domains and forms.

Tests:

- YouTube video;
- YouTube Music video;
- playlist;
- malformed URL;
- unrelated host;
- invalid video id;
- URL containing both list and video id.

Playlist import MUST:

- show progress;
- allow cancellation;
- report partial import;
- deduplicate tracks;
- avoid freezing the UI on large playlists.

---

# 15. Phase 10 — Error Architecture

Create `src/core/errors.ts`.

Example:

```ts
export type AppErrorKind =
  | 'network'
  | 'timeout'
  | 'rate_limited'
  | 'track_unavailable'
  | 'region_restricted'
  | 'source_unavailable'
  | 'parser_changed'
  | 'storage'
  | 'native_module_missing'
  | 'unknown';

export type AppError = {
  kind: AppErrorKind;
  userMessage: string;
  technicalMessage?: string;
  retryable: boolean;
  cause?: unknown;
};
```

Rules:

- user message is concise and actionable;
- technical message may be shown in diagnostics;
- raw stack trace is not shown in normal UI;
- retry button appears only for retryable failures;
- expected content restrictions are not reported as generic "network error";
- native module missing gets a distinct developer/source-build message.

---

# 16. Phase 11 — Performance Requirements

The v1 target is smooth behavior on a mid-range Android device.

## Requirements

- no network parsing on a render path;
- no repeated recommendation regeneration on position updates;
- no JSON persistence every 500 ms;
- debounce storage writes;
- use memoization only where profiling or render frequency justifies it;
- virtualize large lists;
- use stable keys based on provider/domain ids;
- avoid base64 artwork in app state;
- cap history retained in memory/storage or paginate it;
- cache short-lived catalog results with bounded size if needed;
- preload only the next small number of playback items;
- cancel work for abandoned searches/screens.

## Performance diagnostics

Development diagnostics SHOULD track:

- time to first interactive screen;
- search request duration;
- stream resolution duration;
- play tap -> audible playback latency;
- recommendation generation duration;
- storage load/save duration.

Do not upload these values by default.

---

# 17. Phase 12 — Security and Privacy

## 17.1 Permissions

Request only required Android permissions.

For playback:

- INTERNET;
- foreground service permissions required by background audio;
- wake lock only if actually required by the configured playback stack.

Do not request storage, microphone, contacts, location, or notification access unless a real feature requires it.

## 17.2 Network security

- HTTPS only for configured remote services;
- no certificate bypass;
- no globally disabled TLS verification;
- no secrets embedded in JavaScript bundle;
- no cookies persisted unless an approved authenticated feature is added;
- validate user-configured URLs if future resolver endpoints are added.

## 17.3 Logging

Development logs MUST NOT include:

- full temporary stream URL if it contains signed query data;
- cookies;
- authorization headers;
- device identifiers;
- user's full listening history dumps.

## 17.4 Privacy documentation

Create `docs/PRIVACY.md` explaining:

- what stays local;
- what network services receive when searching/playing;
- what is not collected by Monowave;
- behavior of third-party upstream providers;
- how to clear local history/library data.

---

# 18. Phase 13 — Dependency Policy

## Rules

- use Expo-compatible package versions;
- use `npx expo install` for Expo-managed native packages;
- avoid duplicate native packages;
- do not add libraries for trivial utilities;
- pin critical native/extractor dependencies;
- no abandoned package for core playback;
- use Dependabot or equivalent update monitoring;
- upgrade dependencies in isolated PRs after v1 stabilization.

## Required checks

```bash
npm audit
npx expo install --check
npx expo-doctor
npx expo-modules-autolinking verify
```

`npm audit` findings must be triaged, not blindly patched with breaking `--force` changes.

---

# 19. Phase 14 — Automated Testing Strategy

No v1 release without tests.

## 19.1 Unit tests

High priority:

- queue transitions;
- shuffle/repeat;
- URL parsing;
- time formatting;
- catalog parser fixtures;
- error mapping;
- storage migrations;
- recommendation scoring;
- recommendation diversity;
- stream expiry calculation.

## 19.2 Integration tests

Test:

- catalog service + mocked HTTP client;
- stream resolver + mocked native source;
- storage repository round trip;
- player controller with mocked audio adapter;
- recommendation generation from realistic user state.

## 19.3 React Native component tests

Test critical behavior:

- search states;
- mini-player reflects player state;
- like/unlike;
- add-to-playlist;
- queue editing;
- retry/error state;
- history clear confirmation.

## 19.4 Native tests

At minimum, add Kotlin tests for pure helpers where possible:

- id validation;
- stream-selection logic;
- failure-reason mapping;
- expiry/parser helpers if native.

Device/instrumented smoke testing should cover actual module registration.

## 19.5 End-to-end smoke test

Use Maestro or equivalent for a minimal Android flow:

1. launch;
2. open Search;
3. search;
4. select track;
5. verify Now Playing;
6. pause/play;
7. open Library;
8. like track;
9. relaunch;
10. verify persisted state.

Playback-dependent steps may use a dedicated smoke-test track/provider fixture when live upstream reliability is unsuitable for deterministic CI.

---

# 20. Phase 15 — CI

Create `.github/workflows/ci.yml`.

Triggers:

- pull request;
- push to `main`.

Jobs SHOULD include:

## Job A — JS quality

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run test:ci
```

## Job B — Expo integrity

```bash
npm ci
npm run doctor
npm run check:dependencies
npm run check:native:verify
npm run export:android
```

## Job C — clean native generation/build

```bash
npm ci
npx expo prebuild --clean --platform android --no-install
cd android
./gradlew assembleDebug
```

Cache npm/Gradle safely, but CI must still work with a cold cache.

## Branch protection

Require:

- JS quality;
- Expo integrity;
- Android debug build.

No direct merge to release branch with failing gates.

---

# 21. Phase 16 — Versioning and Release Engineering

## 21.1 Single release version

For v1 release:

```text
package.json version = 1.0.0
app.json expo.version = 1.0.0
Git tag = v1.0.0
GitHub Release = v1.0.0
```

Local module version should be coherent.

## 21.2 Android version code

Increment `android.versionCode` monotonically.

Do not reuse a version code for a different store build.

## 21.3 Changelog

Create `CHANGELOG.md` with:

- Added;
- Changed;
- Fixed;
- Security;
- Known issues.

## 21.4 Release workflow

Release pipeline should:

1. run all CI gates;
2. verify clean git tree;
3. verify version consistency;
4. build signed AAB for store;
5. optionally build APK for testing;
6. generate checksums;
7. create release notes from changelog;
8. attach artifacts if policy allows;
9. never commit signing secrets.

## 21.5 Signing

Signing material belongs in:

- secure CI/EAS secret storage;
- local ignored files.

Never in Git.

---

# 22. Phase 17 — Licensing and Third-Party Notices

## Required root files

### `LICENSE`

Full GPL text.

### `COPYRIGHT`

Include project copyright ownership and year.

### `THIRD_PARTY_NOTICES.md`

At minimum document:

- NewPipe Extractor;
- Expo;
- React Native;
- AsyncStorage;
- Phosphor icons;
- any newly added navigation/testing packages where notice is appropriate.

For each significant dependency include:

- project name;
- upstream project;
- license;
- how Monowave uses it;
- whether modified;
- any attribution requirement.

The agent must perform a dependency license review before release.

---

# 23. Phase 18 — README Rewrite

The README is a product promise and build contract.

Required sections:

1. What Monowave is.
2. Screenshots.
3. Verified features.
4. Architecture summary.
5. Requirements.
6. Clean-clone build instructions.
7. Development commands.
8. Native extractor explanation.
9. Privacy model.
10. Known upstream limitations.
11. Troubleshooting.
12. Contributing.
13. License and notices.

Do not claim:

- "seamless playback" before playback smoke tests;
- "flawless navigation";
- "high-quality audio" without defining selection behavior;
- support for a platform not built/tested.

Prefer verifiable wording.

---

# 24. Phase 19 — Product UX Completion

v1 should provide complete behavior for the following flows.

## Onboarding

- optional short explanation;
- no account requirement;
- name/profile optional;
- clear privacy statement;
- skip allowed.

## Home

- greeting;
- continue listening if history exists;
- Discover Mix;
- contextual recommendation rails;
- useful cold-start state.

## Search

- text search;
- track/album/artist/playlist filters if reliable;
- import link;
- recent searches;
- error/retry.

## Library

- liked tracks;
- playlists;
- create/delete playlist;
- add/remove tracks;
- empty states.

## History

- chronological listening history;
- replay;
- clear history with confirmation.

## Player

- artwork;
- title/artist;
- play/pause;
- previous/next;
- seek;
- repeat;
- shuffle;
- queue;
- like;
- add to playlist;
- error/retry;
- background playback;
- lock-screen controls.

## Settings

- app version;
- clear history;
- clear local data with confirmation;
- diagnostics;
- privacy;
- licenses/notices;
- optional appearance settings;
- playback diagnostics.

---

# 25. Diagnostics Screen

A hidden or Settings-accessible diagnostics screen is strongly recommended.

Show non-sensitive status:

- app version;
- build number;
- Expo SDK;
- React Native version;
- native extractor available: yes/no;
- extractor version;
- Android API level;
- last playback error kind;
- last stream resolver used;
- recommendation cache status;
- storage schema version.

Provide "copy diagnostics" but redact:

- signed stream URLs;
- headers;
- personal library/history contents.

This dramatically reduces support/debug time.

---

# 26. Code Quality Standards

## TypeScript

- strict mode;
- no implicit `any`;
- no unchecked external data;
- use discriminated unions for result/error states;
- functions should be small enough to test independently;
- avoid module-wide mutable state except explicitly designed singleton services.

## React

- screen components orchestrate;
- hooks adapt state/services;
- pure UI components render;
- side effects live in hooks/services, not row components;
- no network calls during render.

## Kotlin

- public JS bridge is small;
- extractor internals stay native;
- one initialization path;
- no expected throwable escapes across the bridge;
- normalize result before returning to JS.

## Comments

Comment why, not what.

Document:

- unusual upstream behavior;
- stream expiry logic;
- parser assumptions;
- race prevention;
- licensing-specific build decisions.

---

# 27. File-Level Migration from Current Repository

## `src/App.tsx`

Break apart in this order:

1. move color/spacing constants -> `src/theme/`;
2. move formatting helpers -> `src/utils/`;
3. move `Artwork`, headers, buttons -> `src/components/common/`;
4. move `TrackLine` -> `src/components/lists/TrackRow.tsx`;
5. move `MiniPlayer` -> `src/components/player/MiniPlayer.tsx`;
6. move recommendation panels -> `src/components/recommendations/`;
7. create one file per screen;
8. move navigation to `src/navigation/`;
9. leave `src/app/App.tsx` as provider/navigation composition only.

Target final `App.tsx`: roughly 50-120 lines.

## `src/music.ts`

Replace with catalog/provider layer.

Temporary compatibility facade is allowed during migration, but must be deleted before v1.

## `src/useMonowave.ts`

Split into:

- playback engine;
- queue pure functions;
- library repository/provider;
- player provider/hook;
- recommendation signal adapter.

Delete the old hook after feature parity.

## `src/useRecommendations.ts`

Keep as a thin React adapter or move logic into a provider. It must not own storage binding as a hidden global side effect if that can be initialized explicitly during bootstrap.

## `src/services/recommendations/*`

Preserve algorithms; add tests and type hardening.

## `modules/stream-extractor/*`

Replace placeholder-only module with complete local Expo module.

---

# 28. Recommended Migration Method

Do NOT rewrite everything in one branch.

Use vertical phases where the app continues to compile.

Suggested branch sequence:

```text
refactor/phase-0-build-hygiene
feat/phase-1-native-extractor
refactor/phase-2-domain-types
refactor/phase-3-catalog-provider
refactor/phase-4-stream-resolver
refactor/phase-5-playback-engine
refactor/phase-6-storage
refactor/phase-7-navigation-ui
test/phase-8-test-suite
ci/phase-9-quality-gates
docs/phase-10-release-docs
release/v1.0.0
```

Each branch must pass the current quality gates before moving to the next.

---

# 29. Priority Matrix

## P0 — release blockers

- native extractor implementation;
- native autolinking;
- clean Android build;
- remove tracked `.expo`;
- resolve CNG/native conflict;
- version alignment;
- full license;
- correct Android application id;
- split critical monolith enough to test;
- TypeScript passes;
- Expo Doctor passes;
- CI exists.

## P1 — v1 quality

- parser typing;
- structured errors;
- storage migrations;
- playback engine extraction;
- queue tests;
- recommendation tests;
- search cancellation;
- lock-screen/background verification;
- README/build docs;
- third-party notices;
- accessibility basics.

## P2 — post-v1 enhancement

- advanced caching;
- richer offline behavior;
- animated transitions;
- iOS implementation;
- remote resolver plugins;
- cloud sync;
- localization;
- advanced recommendation explanations;
- download/offline media if legally and technically appropriate.

---

# 30. Quality Score Target

A v1 release candidate should target:

| Area | Target |
|---|---:|
| Functional completeness | 23-25 / 25 |
| Architecture/maintainability | 18-20 / 20 |
| Build/release readiness | 18-20 / 20 |
| Reliability/testing | 12-15 / 15 |
| Documentation/licensing | 10 / 10 |
| UI/product polish | 8-10 / 10 |
| **Overall** | **89-100 / 100** |

The project should not be tagged v1.0.0 until all P0 gates pass.

---

# 31. Definition of Done for v1.0.0

Every checkbox must be true.

## Repository

- [ ] `.expo` is not tracked.
- [ ] generated root Android project is not the source of truth.
- [ ] clean clone installs with `npm ci`.
- [ ] no unexplained generated files are required.

## Native

- [ ] Kotlin extractor exists.
- [ ] downloader exists.
- [ ] module config points at the exact class.
- [ ] native module name matches JS.
- [ ] autolinking detects module.
- [ ] debug APK builds from clean prebuild.
- [ ] real playback verified.

## App

- [ ] home works.
- [ ] search works.
- [ ] library works.
- [ ] playlists work.
- [ ] history works.
- [ ] recommendation mix works.
- [ ] queue works.
- [ ] background playback works.
- [ ] lock-screen control works.
- [ ] rapid track switching does not overlap audio.

## Quality

- [ ] typecheck passes.
- [ ] lint passes.
- [ ] format check passes.
- [ ] unit tests pass.
- [ ] integration tests pass.
- [ ] Expo Doctor passes.
- [ ] dependency check passes.
- [ ] Android export passes.
- [ ] Android debug Gradle build passes.
- [ ] CI passes on release commit.

## Release

- [ ] package version 1.0.0.
- [ ] app version 1.0.0.
- [ ] versionCode correct.
- [ ] tag is v1.0.0.
- [ ] changelog updated.
- [ ] full GPL license exists.
- [ ] third-party notices exist.
- [ ] README build steps reproduced from clean clone.
- [ ] known limitations documented.

---

# 32. AI Agent Operating Instructions

The coding agent should treat this section as execution policy.

## Before modifying code

1. Inspect the current branch and commit.
2. Read:
   - `AGENTS.md`;
   - this specification;
   - `package.json`;
   - `app.json`;
   - module config;
   - current CI if present.
3. Run baseline checks and save failures.
4. Do not assume a failure is caused by the code being changed until reproduced.

## During implementation

1. Work one phase at a time.
2. Preserve a compiling application.
3. Prefer moving existing correct code over rewriting it.
4. Add tests when extracting pure behavior.
5. Do not weaken TypeScript settings to make a migration pass.
6. Do not silence Expo Doctor without understanding the finding.
7. Do not add `eslint-disable` or `@ts-ignore` as a substitute for a fix.
8. Do not add a dependency unless its purpose is documented.
9. Do not change recommendation behavior unintentionally during UI refactors.
10. Do not modify licensing text casually.

## After every phase

Run:

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

For native-related phases also run:

```bash
npx expo prebuild --clean --platform android --no-install
cd android
./gradlew assembleDebug
```

## Agent completion report

For every completed phase, report:

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

Never claim a check passed unless the command was actually executed successfully.

---

# 33. Agent Bootstrap Prompt

Use the following prompt when handing the repository to an autonomous coding agent:

> You are rebuilding Monowave according to `MONOWAVE_REBUILD_SPEC.md`.
>
> Treat the specification as the architecture and release contract. Begin with the earliest incomplete phase. Inspect the repository before editing. Do not perform a full rewrite. Keep the app compiling and make incremental commits.
>
> Highest priorities are: source-complete Android native playback, reproducible clean builds, Expo Doctor/autolinking health, separation of the 1,131-line `src/App.tsx`, typed provider boundaries, playback/storage separation, automated tests, CI, and correct licensing/versioning.
>
> Use CNG/prebuild as the native project source of truth. Root `/android` is generated; authored custom Kotlin belongs in `modules/stream-extractor/android`.
>
> Never mark a phase complete until its acceptance gates have actually run and passed. Never claim playback works unless a real Android build registers `MonowaveExtractor` and successfully plays a resolved track.
>
> Preserve Monowave's local-first recommendation engine and visual identity while improving engineering quality.
>
> At the end of each phase, provide the completion report format defined in the specification.

---

# 34. Final Architecture Principle

Monowave should end with this dependency direction:

```text
UI / Screens
    ↓
Providers / Hooks
    ↓
Domain Services
    ↓
Playback | Library | Recommendations | Catalog
    ↓
Adapters
    ↓
Expo Audio | AsyncStorage | HTTP | Native Extractor
```

Dependencies must point inward toward stable domain contracts.

UI must not know NewPipe details.  
Recommendation code must not know React Native navigation.  
Playback must not parse YouTube Music search JSON.  
The native extractor must not own app library state.  
Storage must not own UI state.  

That separation is the core requirement that turns Monowave from a prototype into a maintainable v1 product.
