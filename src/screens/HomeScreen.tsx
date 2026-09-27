import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import {
  Compass,
  Sparkle,
  Heart,
  Clock,
  Playlist as PlaylistIcon,
  Play,
} from "phosphor-react-native";
import { usePlayer, useRecos } from "../state/PlayerContext";
import {
  SectionRail,
  SectionHeader,
  TrackRow as TrackLine,
  Artwork,
} from "../ui/components";
import { C } from "../ui/theme";
import type { TabScreenProps } from "../navigation/types";
import type { RecoSection } from "../services/recommendations";
import type { Track } from "../music";
import { useScreenContentPadding } from "../ui/utils";

function DiscoverMixPanel({
  section,
  onPlay,
}: {
  section: RecoSection;
  onPlay: (track: Track, list: Track[]) => void;
}) {
  const artists = [...new Set(section.tracks.map((track) => track.artist))]
    .slice(0, 3)
    .join(" · ");
  return (
    <Pressable
      style={({ pressed }) => [
        styles.mixCard,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
        pressed && { opacity: 0.88 },
      ]}
      onPress={() => onPlay(section.tracks[0], section.tracks)}
      accessibilityRole="button"
      accessibilityLabel={`Discover Mix: ${section.title}. Tap to play.`}
    >
      <View style={styles.mixGlow} />
      <Text style={styles.kicker}>MADE FROM YOUR LISTENING</Text>
      <Text style={styles.mixTitle}>{section.title}</Text>
      <Text numberOfLines={2} style={styles.mixSubtitle}>
        {section.subtitle}
        {section.context ? ` · ${section.context}` : ""}
      </Text>
      {!!artists && (
        <Text numberOfLines={1} style={styles.mixArtists}>
          {artists}
        </Text>
      )}
    </Pressable>
  );
}

export function HomeScreen({ navigation }: TabScreenProps<"Home">) {
  const { playTrack, data } = usePlayer();
  const { reco } = useRecos();
  const contentPadding = useScreenContentPadding();
  const recommendations = reco?.sections ?? {};
  const activeSections = Object.values(recommendations).filter(
    (r) => (r as RecoSection).tracks.length > 0,
  ) as RecoSection[];

  const hasHistory = data.history.length > 0;
  const hasLiked = data.liked.length > 0;
  const recentTracks = data.history.slice(0, 5).map((h) => h.track);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, contentPadding]}
    >
      <View style={styles.heroArea}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />
        <Text style={styles.hero}>Your sound. Your rules.</Text>
        <Text style={styles.heroSub}>
          Local-first, private audio streaming.
        </Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate("Search")}
        style={({ pressed }) => [
          styles.discoveryCard,
          { transform: [{ scale: pressed ? 0.97 : 1 }] },
          pressed && { opacity: 0.88 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Find something new. Tap to search tracks, albums, or paste a YouTube link."
      >
        <View style={styles.discoveryIcon}>
          <Compass size={28} color={C.text} weight="duotone" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.discoveryTitle}>Find something new</Text>
          <Text style={styles.discoverySub}>
            Search tracks, albums, or paste a YouTube link
          </Text>
        </View>
      </Pressable>

      {/* Quick shortcuts */}
      <View style={styles.shortcutsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.shortcutPill,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
          onPress={() => navigation.navigate("Library")}
          accessibilityRole="button"
          accessibilityLabel={`Liked songs: ${data.liked.length} tracks`}
        >
          <Heart size={16} color={C.accent} weight="fill" />
          <Text style={styles.shortcutText}>Liked ({data.liked.length})</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.shortcutPill,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
          onPress={() => navigation.navigate("Library")}
          accessibilityRole="button"
          accessibilityLabel={`Playlists: ${data.playlists.length}`}
        >
          <PlaylistIcon size={16} color={C.text} weight="bold" />
          <Text style={styles.shortcutText}>
            Playlists ({data.playlists.length})
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.shortcutPill,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
          onPress={() => navigation.navigate("History")}
          accessibilityRole="button"
          accessibilityLabel={`History: ${data.history.length} plays`}
        >
          <Clock size={16} color={C.muted} weight="bold" />
          <Text style={styles.shortcutText}>History</Text>
        </Pressable>
      </View>

      {/* Recommendations if available */}
      {activeSections.length > 0 ? (
        activeSections.map((r, index) =>
          index === 0 ? (
            <DiscoverMixPanel
              key={r.title || index}
              section={r}
              onPlay={playTrack}
            />
          ) : (
            <SectionRail
              key={r.title || index}
              section={r}
              onPlay={playTrack}
            />
          ),
        )
      ) : (
        /* Cold-start informative guidance */
        <View style={styles.coldStartCard}>
          <View style={styles.coldStartIconWrap}>
            <Sparkle size={26} color={C.accent} weight="fill" />
          </View>
          <Text style={styles.coldStartTitle}>
            Discover Mix adapts on-device
          </Text>
          <Text style={styles.coldStartDesc}>
            Listen to a few songs and your Discover Mix will automatically
            generate right here. Recommendations are calculated locally without
            any accounts, profiles, or tracking.
          </Text>
        </View>
      )}

      {/* Recently played section if available */}
      {hasHistory ? (
        <View style={{ marginTop: 24 }}>
          <SectionHeader
            title="Recently played"
            action="View all"
            onAction={() => navigation.navigate("History")}
          />
          {recentTracks.map((track, i) => (
            <TrackLine
              key={`${track.id}-${i}`}
              track={track}
              onPress={() => playTrack(track, recentTracks)}
              card
            />
          ))}
        </View>
      ) : null}

      {/* Liked songs quick play banner if user has likes */}
      {hasLiked && !hasHistory ? (
        <View style={styles.likedHeroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.likedHeroTitle}>Your Liked Tracks</Text>
            <Text style={styles.likedHeroSubtitle}>
              {data.liked.length} song{data.liked.length === 1 ? "" : "s"} saved
              to device
            </Text>
          </View>
          <Pressable
            style={styles.playLikedButton}
            onPress={() => playTrack(data.liked[0], data.liked)}
            accessibilityRole="button"
            accessibilityLabel="Play all liked songs"
          >
            <Play size={20} color={C.text} weight="fill" />
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22 },
  heroArea: {
    minHeight: 140,
    justifyContent: "center",
    overflow: "hidden",
    marginHorizontal: -22,
    paddingHorizontal: 22,
    marginTop: 0,
    marginBottom: 4,
  },
  heroOrbA: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -60,
    backgroundColor: "#813BFF30",
  },
  heroOrbB: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: 55,
    bottom: -75,
    backgroundColor: "#1C75FF20",
  },
  hero: {
    color: C.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1.1,
    maxWidth: "92%",
  },
  heroSub: {
    color: C.muted,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  discoveryCard: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 22,
    backgroundColor: C.panelStrong,
    borderWidth: 1,
    borderColor: C.lineStrong,
    gap: 13,
  },
  discoveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF0C",
    borderWidth: 1,
    borderColor: "#FFFFFF12",
  },
  discoveryTitle: { color: C.text, fontSize: 17, fontWeight: "800" },
  discoverySub: { color: C.muted, fontSize: 13, marginTop: 3, lineHeight: 18 },
  shortcutsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
  },
  shortcutPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.panelStrong,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  shortcutText: {
    color: C.text,
    fontSize: 12.5,
    fontWeight: "700",
  },
  coldStartCard: {
    marginTop: 18,
    padding: 22,
    borderRadius: 24,
    backgroundColor: "#151326",
    borderWidth: 1,
    borderColor: C.lineStrong,
    alignItems: "center",
  },
  coldStartIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#A14BFF22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  coldStartTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  coldStartDesc: {
    color: C.muted,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
  },
  mixCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#19172F",
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  mixGlow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -55,
    top: -85,
    backgroundColor: "#A14BFF38",
  },
  mixTitle: { color: C.text, fontSize: 26, fontWeight: "900", marginTop: 7 },
  mixSubtitle: { color: C.muted, fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  mixArtists: { color: C.faint, fontSize: 12.5, marginTop: 5 },
  kicker: {
    color: C.accent,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "800",
  },
  likedHeroCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 22,
    backgroundColor: C.panelStrong,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  likedHeroTitle: { color: C.text, fontSize: 17, fontWeight: "800" },
  likedHeroSubtitle: { color: C.muted, fontSize: 13, marginTop: 2 },
  playLikedButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
