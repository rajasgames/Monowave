import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Play, Pause, Heart } from "phosphor-react-native";
import { Artwork } from "./Common";
import { C } from "../theme";
import type { Track } from "../../music";

export function MiniPlayer({
  track,
  playing,
  position,
  duration,
  onOpen,
  onToggle,
  onLike,
  liked,
}: {
  track: Track;
  playing: boolean;
  position: number;
  duration: number;
  onOpen: () => void;
  onToggle: () => void;
  onLike: () => void;
  liked: boolean;
}) {
  const progress = Math.min(100, duration ? (position / duration) * 100 : 0);
  return (
    <BlurView intensity={60} tint="dark" style={styles.miniPlayerShell}>
      <View style={styles.miniProgress}>
        <View style={[styles.miniProgressFill, { width: `${progress}%` }]} />
      </View>
      <Pressable onPress={onOpen} style={styles.miniPlayerMain} accessibilityRole="button" accessibilityLabel={`Now playing: ${track.title} by ${track.artist}`}>
        <Artwork uri={track.cover} size={46} radius={11} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.miniTitle}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.miniArtist}>
            {track.artist}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={onToggle} hitSlop={8} style={styles.miniControl} accessibilityRole="button" accessibilityLabel={playing ? "Pause" : "Play"}>
        <Text style={styles.miniControlText}>
          {playing ? (
            <Pause size={20} color={C.text} weight="fill" />
          ) : (
            <Play size={20} color={C.text} weight="fill" />
          )}
        </Text>
      </Pressable>
      <Pressable onPress={onLike} hitSlop={8} style={styles.miniControl} accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"}>
        <Text style={[styles.miniHeart, liked && { color: C.accent }]}>
          {liked ? (
            <Heart size={22} color={C.accent} weight="fill" />
          ) : (
            <Heart size={22} color={C.muted} />
          )}
        </Text>
      </Pressable>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  miniPlayerShell: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 100,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#19172E80",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF22",
    paddingHorizontal: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 9,
  },
  miniProgress: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: "#FFFFFF12",
  },
  miniProgressFill: { height: 2, backgroundColor: C.accent },
  miniPlayerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 9,
  },
  miniTitle: { color: C.text, fontSize: 13.5, fontWeight: "800" },
  miniArtist: { color: C.muted, fontSize: 11.5, marginTop: 3 },
  miniControl: {
    width: 42,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  miniControlText: { color: C.text, fontSize: 18, fontWeight: "900" },
  miniHeart: { color: C.muted, fontSize: 22 },
});
