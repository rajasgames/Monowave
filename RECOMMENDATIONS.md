# Recommendations Engine

Monowave uses an on-device recommendation engine to generate the "Discover Mix".

## Signals
- **Positive**: Completes (1.6), Plays (0.5), Playlist Adds (1.2), Likes (3.0)
- **Negative**: Skips (-2.0), Quick Skips (-2.6)

## Scoring
The engine aggregates all signals for known tracks and artists. 
When computing candidates from YouTube's "Related Tracks" or radio endpoints:
- It scores candidates based on their artist's affinity, seed decay, and exploration bonus.
- Applies a deterministic jitter for stable shuffling.

## Diversity
To prevent one artist from flooding the mix:
- A sliding window limits consecutive artist appearances.
- A hard cap limits total artist presence in the mix.
- An exploration ratio injects unknown/novel tracks.
