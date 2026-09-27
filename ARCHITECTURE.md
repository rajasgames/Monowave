# Monowave Architecture

Monowave is an Android-first, local-first music player built with Expo, React Native, and native Kotlin modules. It operates entirely without an account, tracking, or remote Monowave server.

---

## 1. Architectural Principles

1. **Local-First & Sovereign**: All playlists, liked tracks, listening history, search terms, and recommendation profiles reside on the user's device in sandboxed storage.
2. **Deterministic State Ownership**: State is separated into discrete domain controllers with explicit lifecycles. Presentation screens never interact directly with low-level storage or raw native bridges.
3. **Resilient Playback Pipeline**: Audio streaming is treated as the primary user journey. Media streams are resolved just-in-time, cached in memory with expiration tracking, and automatically refreshed if expired or rejected by the source.
4. **On-Device Personalization**: Recommendations are computed locally using listening activity signals (completions, skips, playlist additions) without uploading listening patterns.

---

## 2. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  HomeScreen, SearchScreen, NowPlayingScreen, LibraryScreen, │
│     PlaylistScreen, CollectionScreen, SettingsScreen        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Context Selectors / Hooks
┌──────────────────────────────▼──────────────────────────────┐
│                  Application State Layer                    │
│   usePlaybackController  ·  useQueueController              │
│   useLibraryController   ·  usePreferencesController        │
│   Granular Contexts: PlaybackContext, QueueContext, etc.    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│       Playback Engine       │ │     Storage Repositories    │
│  - PlaybackEngine           │ │  - LibraryRepository        │
│  - Generation counters      │ │  - PreferencesRepository    │
│  - Lock-screen session      │ │  - SearchHistoryRepository  │
│  - expo-audio integration   │ │  - Schema migration & cache │
└──────────────┬──────────────┘ └─────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│     Stream Resolver         │ │        AsyncStorage         │
│  - In-memory cache & TTL    │ │  - Versioned JSON envelopes │
│  - 1-time 403 / expiry retry│ │  - Corrupted data recovery  │
│  - Concurrency deduplication│ └─────────────────────────────┘
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│              Native Stream Extractor Module                 │
│  - modules/stream-extractor (Kotlin Expo Module)            │
│  - NewPipeExtractor (direct client extraction)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Breakdown

### 3.1 State & Controller Layer (`src/state/`)

To eliminate re-render storms (such as 500ms playback position updates forcing unaffected screens to re-render), the state system is segmented into dedicated controllers and contexts:

- `usePlaybackController`: Subscribes to `PlaybackEngine` snapshots. Exposes `playing`, `position`, `duration`, `status`, and controls (`playTrack`, `pause`, `resume`, `seek`, `seekBy`).
- `useQueueController`: Pure queue management. Manages `queue`, `index`, `shuffle`, `repeat`, `enqueue`, `addNext`, `removeQueued`, `moveQueued`, and `clearQueue`.
- `useLibraryController`: Backed by `LibraryRepository`. Manages user collections (`liked`, `playlists`, `history`, `profileName`). Emits recommendation signals on user interactions.
- `usePreferencesController`: Backed by `PreferencesRepository`. Manages user settings (`seekIntervalSeconds`, `autoplay`, `enableDiscoverMix`).
- `PlayerContext.tsx`: Hosts granular React contexts (`PlaybackContext`, `QueueContext`, `LibraryContext`, `PreferencesContext`, `ActionTrackContext`) plus a backward-compatible composite `usePlayer()`.

### 3.2 Storage & Persistence (`src/storage/`)

Direct `AsyncStorage` access from presentation screens is prohibited. All persistence passes through repositories:

- **`LibraryRepository`**: Stores `LibraryData` with an immediate in-memory cache and debounced disk writes. Includes an explicit `flush()` for lifecycle transitions.
- **`PreferencesRepository`**: Persists user configuration with validation and sensible defaults.
- **`SearchHistoryRepository`**: Maintains a bounded list of up to 20 unique recent search queries, trimming whitespace and deduplicating entries.
- **`migrations.ts`**: Provides runtime schema validation, backward-compatible migration from legacy structures, and non-destructive fallbacks for malformed JSON.

### 3.3 Playback & Stream Resolution (`src/playback/`, `src/providers/stream/`)

- **`PlaybackEngine`**: Wraps `expo-audio` to manage player lifecycles, active lock-screen metadata, background audio modes, and listener dispatch. Uses generation counters to discard stale async resolutions caused by rapid track tapping.
- **`StreamResolver`**:
  - Checks in-memory cache for valid resolved stream URLs.
  - Invalidates entries within 60 seconds of expiration.
  - Deduplicates concurrent in-flight requests for the same track ID.
  - Provides `resolveWithRetry`: automatically clears cache and re-extracts a fresh URL if playback fails due to an expired stream or 403 error.
- **`NativeStreamSource`**: Bridges to the Kotlin `StreamExtractorModule` using NewPipeExtractor to resolve direct audio stream URLs.

### 3.4 Recommendation Engine (`src/services/recommendations/`)

Computes recommendations locally on the device using a deterministic scoring and diversity model:

- **Signals**: Listens for completion events (+1.0), playlist additions (+1.5), and skips (-0.5).
- **Profile**: Maintains rolling artist and genre affinities with time-based decay.
- **Cold Start**: When insufficient listening history exists, provides structured discovery mixes from curated YouTube Music shelves with clear UI guidance.

---

## 4. Error Taxonomy (`src/core/errors.ts`)

Errors are mapped into structured `AppError` objects rather than exposing raw native exceptions to users:

| Kind                    | Description                                  | Retryable |
| ----------------------- | -------------------------------------------- | --------- |
| `network`               | No internet connection or connection dropped | Yes       |
| `timeout`               | Upstream network request timed out           | Yes       |
| `rate_limited`          | Upstream service rate limiting (429)         | Yes       |
| `track_unavailable`     | Track removed, privated, or deleted          | No        |
| `region_restricted`     | Track blocked in user's geographic area      | No        |
| `source_unavailable`    | No stream extractor could resolve URL        | Yes       |
| `parser_changed`        | Upstream HTML/API structure changed          | No        |
| `storage`               | Local storage read/write failure             | Yes       |
| `native_module_missing` | Native Kotlin module not linked              | No        |
| `unknown`               | Unclassified runtime error                   | No        |
