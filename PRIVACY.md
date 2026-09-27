# Monowave Privacy Policy & Data Architecture

Monowave is designed from first principles around user autonomy, local-first data storage, and strict privacy.

---

## 1. What Monowave Does NOT Do

- **No User Accounts**: Monowave has no sign-up screen, registration process, or login requirement.
- **No Monowave Backend**: There is no remote Monowave server collecting profiles, libraries, or activity.
- **No Telemetry or Tracking**: The app contains zero analytics SDKs, tracker libraries, advertising frameworks, or background behavioral monitors.
- **No Cloud Synchronization**: Your playlists, liked songs, listening history, search terms, and recommendation models stay on your device and are never transmitted to us.

---

## 2. On-Device Storage

All user data is stored within your Android device's private app sandbox using versioned local storage:

- **Playlists & Liked Tracks**: Saved locally in your app's sandboxed storage.
- **Listening History**: Stored locally to enable your "Recently Played" shelf and playback resume.
- **Search History**: Stored locally (bounded to your last 20 queries) and can be cleared in Settings at any time.
- **Recommendation Weights**: Computed mathematically on your device from your listening habits and stored locally. You can reset your recommendation profile in Settings at any time without deleting your saved playlists.

---

## 3. Network Communication

Because Monowave is an online streaming client, network requests are necessary to search for catalog items and stream audio:

- **Direct Upstream Requests**: When searching for music, browsing shelves, or streaming audio, your device connects directly to public streaming endpoints over standard HTTPS.
- **No Intermediary Proxies**: Traffic is not routed through any third-party proxy servers operated by Monowave.
- **Standard Internet Protocol**: Like any web browser or streaming client, these outbound requests expose your device's IP address and standard client headers to the requested endpoints.
- **No Authentication Headers**: Monowave does not send Google account cookies or credentials when fetching streams.

---

## 4. User Controls & Data Management

In Monowave's **Settings**, you have complete control over all stored data:

- **Clear Search History**: Wipes all cached search queries.
- **Clear Listening History**: Erases playback logs while preserving your saved playlists and liked tracks.
- **Reset Recommendation Profile**: Resets on-device artist and genre affinity weights to their initial state.
- **Reset App Data**: Completely wipes all local storage and returns Monowave to a clean install state.

---

## 5. Third-Party Notices & Independence

Monowave is an independent open-source project distributed under the GNU General Public License v3.0 or later (GPL-3.0-or-later). It utilizes the NewPipe Extractor library for local stream extraction. Monowave is not affiliated with, endorsed by, or sponsored by Google, YouTube, or any parent or subsidiary companies.
