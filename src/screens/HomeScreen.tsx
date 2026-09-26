import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Compass } from "phosphor-react-native";
import { usePlayer, useRecos } from "../state/PlayerContext";
import { SectionRail } from "../ui/components";
import { C } from "../ui/theme";
import type { TabScreenProps } from "../navigation/types";
import type { RecoSection } from "../services/recommendations";
import type { Track } from "../music";

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
      style={({ pressed }) => [styles.mixCard, pressed && { opacity: 0.72 }]}
      onPress={() => onPlay(section.tracks[0], section.tracks)}
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
  const { playTrack } = usePlayer();
  const { reco } = useRecos();
  const recommendations = reco?.sections ?? {};

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.heroArea}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />
        <Text style={styles.hero}>Your sound. Your rules.</Text>
      </View>
      <Pressable
        onPress={() => navigation.navigate("Search")}
        style={styles.discoveryCard}
      >
        <View style={styles.discoveryIcon}>
          <Compass size={29} color={C.text} weight="duotone" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.discoveryTitle}>Find something new</Text>
          <Text style={styles.discoverySub}>
            Search tracks, albums, or paste a YouTube link
          </Text>
        </View>
      </Pressable>
      {Object.values(recommendations)
        .filter((r) => (r as RecoSection).tracks.length > 0)
        .map((r, index) =>
          index === 0 ? (
            <DiscoverMixPanel key={index} section={r as RecoSection} onPlay={playTrack} />
          ) : (
            <SectionRail key={index} section={r as RecoSection} onPlay={playTrack} />
          )
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 100 },
  heroArea: {
    minHeight: 170,
    justifyContent: "center",
    overflow: "hidden",
    marginHorizontal: -22,
    paddingHorizontal: 22,
    marginTop: -14,
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
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
    letterSpacing: -1.1,
    maxWidth: "90%",
  },
  discoveryCard: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
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
  discoveryTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  discoverySub: { color: C.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
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
  mixTitle: { color: C.text, fontSize: 28, fontWeight: "900", marginTop: 7 },
  mixSubtitle: { color: C.muted, fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  mixArtists: { color: C.faint, fontSize: 12.5, marginTop: 5 },
  kicker: {
    color: C.accent,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "800",
  },
});
