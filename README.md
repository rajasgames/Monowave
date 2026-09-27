# Monowave

> **Your music player, without an account, feed, ads, tracking, or cloud profile.**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Android: 7.0+](<https://img.shields.io/badge/Android-7.0%2B%20(API%2024%2B)-brightgreen.svg>)](https://developer.android.com)
[![CI Quality Gates](https://github.com/rajasgames/Monowave/actions/workflows/ci.yml/badge.svg)](https://github.com/rajasgames/Monowave/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/rajasgames/Monowave?include_prereleases&color=orange)](https://github.com/rajasgames/Monowave/releases)

---

## 📥 Download Monowave

### [👉 Download Latest Release (APK)](https://github.com/rajasgames/Monowave/releases/latest)

### Which APK do I need?

| Package                        | Recommended For              | Description                                                          |
| ------------------------------ | ---------------------------- | -------------------------------------------------------------------- |
| **`monowave-universal.apk`**   | **Most Users (Recommended)** | Compatible with all modern Android devices. Download this if unsure. |
| **`monowave-arm64-v8a.apk`**   | Modern Phones & Tablets      | Optimized build with a smaller download size for 64-bit ARM devices. |
| **`monowave-armeabi-v7a.apk`** | Older Android Devices        | Optimized for 32-bit ARM devices.                                    |
| **`monowave-x86_64.apk`**      | Emulators & Chromebooks      | Optimized for Intel/AMD x86_64 Android environments.                 |

- **Minimum Android Version**: Android 7.0 (Nougat, API 24) or newer.
- **Verification**: Checksums are published in `SHA256SUMS.txt` with every release. Verify with `sha256sum -c SHA256SUMS.txt`.

---

## Why Monowave?

Modern music streaming apps have become bloated social feeds filled with algorithms designed to maximize engagement, mandatory account walls, behavioral tracking, and intrusive promotions.

**Monowave returns control to the listener:**

- **No Account Required**: Open the app and start listening immediately.
- **Zero Telemetry or Ads**: No analytics SDKs, trackers, or marketing pixels.
- **Local-First Library**: Your playlists, likes, and listening history stay on your device.
- **On-Device Recommendations**: Your "Discover Mix" is calculated mathematically right on your device based on your listening activity, not on a remote server.
- **Native Audio Streaming**: Employs NewPipe Extractor natively in Kotlin to stream audio directly to your device without intermediate proxies.
- **Full Media Controls**: Seamless background playback and lock-screen controls.

---

## ✨ Key Features

- 🎧 **Background Playback & Lock-Screen**: Full integration with Android's MediaSession, supporting notification controls, lock-screen artwork, seek backward/forward, and headset controls.
- 🔮 **Adaptive Discover Mix**: An on-device recommendation model that tracks completion rates, skips, and playlist adds to recommend music that fits your taste without sharing your habits.
- ⚡ **Instant Search & Shelves**: Search songs, artists, albums, and playlists with responsive debounced querying and automatic query caching.
- 📚 **Personal Library**: Create and organize custom playlists, curate liked songs, and review listening history.
- 🛡️ **Defensive Engineering**: Resilient playback state machine with 1-time automatic stream renewal on 403 or URL expiration, defensive data migrations, and graceful offline degradation.
- 🎨 **Sleek Aesthetic**: Deep midnight dark mode, glassmorphic accents, and Phosphor icons.

---

## 🔒 Privacy & Sovereignty

Monowave is strictly local-first:

1. We do not operate a user-profile server or user database.
2. We do not collect, track, or sell your personal data or listening habits.
3. Media streams and search requests are sent directly to public YouTube endpoints via HTTPS using NewPipe Extractor. No Monowave proxy sits between you and the stream.

For full technical details, read our [PRIVACY.md](./PRIVACY.md).

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React Native with Expo SDK 57 (New Architecture enabled).
- **Audio Core**: `expo-audio` with Android foreground service & lock-screen MediaSession.
- **Stream Extraction**: Native Kotlin module wrapping [NewPipeExtractor](https://github.com/TeamNewPipe/NewPipeExtractor).
- **State Layer**: Granular React Contexts and dedicated domain controllers (`usePlaybackController`, `useQueueController`, `useLibraryController`, `usePreferencesController`).
- **Storage Layer**: Schema-enveloped persistence with automatic version migrations and corrupted data recovery.
- **Styling**: Curated dark theme tokens with custom Phosphor icons.

Detailed architectural specifications are documented in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 💻 Building from Source

### Prerequisites

- Node.js 22.x LTS
- Java Development Kit (JDK 17)
- Android SDK (API 24+)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/rajasgames/Monowave.git
cd Monowave

# Install dependencies
npm ci

# Verify environment integrity
npm run doctor

# Prebuild native Android project
npm run prebuild:android

# Run on connected Android device or emulator
npm run android
```

### Running Verification Tests

```bash
npm run typecheck       # TypeScript strict checking
npm run lint            # ESLint rules
npm run format:check    # Prettier code style
npm test                # Jest test suite (105 tests across 19 suites)
```

---

## 📜 Legal & License

- **License**: Monowave is open-source software licensed under the [GNU General Public License v3.0 or later (GPL-3.0-or-later)](./LICENSE).
- **Attribution**: Stream extraction is powered by the open-source [NewPipe Extractor](https://github.com/TeamNewPipe/NewPipeExtractor) library, licensed under GPL-3.0.
- **Disclaimer**: Monowave is an independent media player and is not affiliated with, authorized, maintained, sponsored, or endorsed by Google LLC, YouTube, or any of their affiliates.

---

## 🤝 Documentation & Community

- [Architecture Guide](./ARCHITECTURE.md)
- [Privacy Policy](./PRIVACY.md)
- [Release & Signing Guide](./RELEASE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Troubleshooting & FAQ](./TROUBLESHOOTING.md)
- [Third-Party Notices](./THIRD_PARTY_NOTICES.md)
