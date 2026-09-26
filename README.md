# Monowave

A beautifully simple, local-first music streaming app powered by YouTube Music but free of their algorithms and tracking. Built with Expo, React Native, and a local NewPipe extractor.

## Features

- **No Server:** Everything runs on your device. The app talks directly to YouTube Music via NewPipe Extractor.
- **Local-First Library:** Playlists, history, and liked songs are saved to local SQLite/AsyncStorage.
- **Offline Capable:** Cached thumbnails and robust offline modes (streaming requires network).
- **Custom Recommendations:** An on-device algorithm (TF-IDF + Collaborative Filtering approximation) scores your listening history and crafts a "Discover Mix" just for you.
- **P0 Background Audio:** Seamless background and lock-screen playback integration via `expo-audio`.

## Getting Started

See [BUILDING.md](./BUILDING.md) for instructions on setting up your local environment and running the app.

## License

Monowave is licensed under the GPL-3.0-or-later. See the [LICENSE](./LICENSE) file for more information.
