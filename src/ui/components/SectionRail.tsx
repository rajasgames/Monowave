import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Play } from "phosphor-react-native";
import { SectionHeader, Artwork } from "./Common";
import { C } from "../theme";
import type { Track } from "../../music";
import type { RecoSection } from "../../services/recommendations";

export function SectionRail({
  section,
  onPlay,
}: {
  section: RecoSection;
  onPlay: (track: Track, list: Track[]) => void;
}) {
  return (
    <View style={styles.sectionBlock}>
      <SectionHeader title={section.title} detail={section.subtitle} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {section.tracks.map((track, index) => (
          <Pressable
            key={`${track.id}-${index}`}
            style={styles.railCard}
            onPress={() => onPlay(track, section.tracks)}
          >
            <View style={styles.railArtWrap}>
              <Artwork uri={track.cover} size={146} radius={18} />
              <View style={styles.playBadge}>
                <Play
                  size={16}
                  color={C.text}
                  weight="fill"
                  style={styles.playBadgeText}
                />
              </View>
            </View>
            <Text numberOfLines={1} style={styles.railTitle}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={styles.railArtist}>
              {track.artist}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: { marginTop: 8 },
  rail: { gap: 14, paddingRight: 6 },
  railCard: { width: 146 },
  railArtWrap: { position: "relative" },
  playBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#11111DDD",
    borderWidth: 1.5,
    borderColor: "#FFFFFFCC",
    alignItems: "center",
    justifyContent: "center",
  },
  playBadgeText: { marginLeft: 2 },
  railTitle: { color: C.text, fontSize: 14, fontWeight: "800", marginTop: 9 },
  railArtist: { color: C.muted, fontSize: 12.5, marginTop: 3 },
});
