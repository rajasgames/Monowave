import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { DotsThreeVertical } from "phosphor-react-native";
import { Artwork } from "./Common";
import { C } from "../theme";
import type { Track } from "../../music";

export function TrackRow({
  track,
  onPress,
  onMore,
  trailing,
  meta,
  card = false,
}: {
  track: Track;
  onPress: () => void;
  onMore?: () => void;
  trailing?: React.ReactNode;
  meta?: string;
  card?: boolean;
}) {
  return (
    <View style={[styles.trackLine, card && styles.trackLineCard]}>
      <Pressable
        style={({ pressed }) => [
          styles.trackLineMain,
          { transform: [{ scale: pressed ? 0.985 : 1 }] },
          pressed && { opacity: 0.82 },
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Play ${track.title} by ${track.artist}`}
      >
        <Artwork uri={track.cover} size={56} />
        <View style={styles.trackText}>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.trackArtist}>
            {track.artist}
          </Text>
        </View>
      </Pressable>
      {meta ? <Text style={styles.trackMeta}>{meta}</Text> : null}
      {onMore ? (
        <Pressable
          hitSlop={12}
          onPress={onMore}
          style={({ pressed }) => [
            styles.moreButton,
            { transform: [{ scale: pressed ? 0.86 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          {trailing ? (
            <Text style={styles.ellipsis}>{trailing}</Text>
          ) : (
            <DotsThreeVertical size={24} color={C.muted} weight="bold" />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trackLine: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
    gap: 8,
  },
  trackLineCard: {
    minHeight: 86,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    backgroundColor: "#0E0F20",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  trackLineMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 9,
  },
  trackText: { flex: 1, gap: 4 },
  trackTitle: { color: C.text, fontSize: 15, fontWeight: "800" },
  trackArtist: { color: C.muted, fontSize: 13 },
  trackMeta: {
    color: C.muted,
    fontSize: 11.5,
    minWidth: 68,
    textAlign: "right",
  },
  moreButton: {
    width: 34,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  ellipsis: { color: C.muted, fontSize: 23, lineHeight: 26 },
});
