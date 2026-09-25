# Monowave UI redesign

The app UI was rebuilt around a darker, more polished music-first visual system while keeping the existing playback, search, recommendation, library, playlist, history, and settings logic intact.

## Main changes

- New Monowave header, dark surfaces, violet accents, depth, borders, and spacing system.
- Redesigned Home with a stronger hero, discovery entry point, richer recommendation rails, play badges, and recommendation status.
- Redesigned Search with a large search field, filters, recent/trending terms derived from local activity, mood shortcuts, and category shortcuts.
- Redesigned Library with summary cards, improved liked-song presentation, playlist creation, playlist cards, and YouTube Music import flow.
- Redesigned History with timestamped cards and a clear-history action.
- Redesigned Now Playing screen with large artwork, progress control, playback controls, like action, and queue styling.
- Redesigned Collection, Playlist, Settings, action sheet, mini-player, error banner, and bottom navigation.
- No new runtime dependencies were added.

The main implementation is in `src/App.tsx`.
