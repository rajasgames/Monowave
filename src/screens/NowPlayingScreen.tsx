import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  CaretLeft,
  DotsThreeVertical,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Heart,
  Plus,
  Waveform,
  X,
} from "phosphor-react-native";
import { usePlayer } from "../state/PlayerContext";
import { Artwork } from "../ui/components";
import { C } from "../ui/theme";
import { formatTime } from "../ui/utils";
import type { RootScreenProps } from "../navigation/types";

export function NowPlayingScreen({ navigation }: RootScreenProps<"Player">) {
  const player = usePlayer();
  const { current, playing, position, duration, busy } = player;
  const { data } = player;

  const [barWidth, setBarWidth] = useState(1);

  // We should extract the action sheet to the App root or pass a context, 
  // for now we'll just not have it here or we can use a local state for this screen's action track
  const [actionTrack, setActionTrack] = useState<any>(null);

  const displayDuration = duration || current?.duration || 0;
  const progressPercent = displayDuration
    ? (position / displayDuration) * 100
    : 0;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.playerHeader}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <CaretLeft size={28} color={C.text} weight="bold" />
        </Pressable>
        <Text style={styles.playerHeaderTitle}>Now Playing</Text>
        <Pressable
          onPress={() => current && setActionTrack(current)}
          hitSlop={12}
        >
          <DotsThreeVertical size={28} color={C.text} weight="bold" />
        </Pressable>
      </View>
      <View style={styles.playerArt}>
        <Artwork uri={current?.cover} size={310} radius={18} />
      </View>
      <Text style={styles.playerTitle} numberOfLines={2}>
        {current?.title ?? "Nothing playing"}
      </Text>
      <Text style={styles.playerArtist}>{current?.artist}</Text>

      <View
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        style={styles.progressArea}
      >
        <Pressable
          style={styles.progress}
          onPress={(event) =>
            player.seek((event.nativeEvent.locationX / barWidth) * displayDuration)
          }
        >
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, progressPercent)}%` },
            ]}
          />
        </Pressable>
        <View style={styles.progressLabels}>
          <Text style={styles.progressTime}>{formatTime(position)}</Text>
          <Text style={styles.progressTime}>{formatTime(displayDuration)}</Text>
        </View>
      </View>

      <View style={styles.playerControls}>
        <Pressable onPress={player.toggleShuffle} style={styles.secondaryControl}>
          <Shuffle
            size={24}
            color={data.shuffle ? C.text : C.muted}
            weight="bold"
          />
        </Pressable>
        <Pressable onPress={player.previous} style={styles.skipControl}>
          <SkipBack size={32} color={C.text} weight="fill" />
        </Pressable>
        <Pressable onPress={player.toggle} style={styles.mainPlayControl}>
          {busy ? (
            <ActivityIndicator color={C.bg} size="large" />
          ) : playing ? (
            <Pause size={32} color={C.bg} weight="fill" />
          ) : (
            <Play size={32} color={C.bg} weight="fill" />
          )}
        </Pressable>
        <Pressable onPress={player.next} style={styles.skipControl}>
          <SkipForward size={32} color={C.text} weight="fill" />
        </Pressable>
        <Pressable onPress={player.cycleRepeat} style={styles.secondaryControl}>
          <Repeat
            size={24}
            color={data.repeat !== "off" ? C.text : C.muted}
            weight="bold"
          />
        </Pressable>
      </View>

      {!!current ? (
        <View style={styles.playerSecondaryActions}>
          <Pressable onPress={() => player.like(current)} hitSlop={12}>
            {data.liked.some((t) => t.id === current.id) ? (
              <Heart size={26} color={C.accent} weight="fill" />
            ) : (
              <Heart size={26} color={C.muted} />
            )}
          </Pressable>
          <Pressable onPress={() => setActionTrack(current)} hitSlop={12}>
            <Plus size={26} color={C.muted} />
          </Pressable>
          <Pressable onPress={() => setActionTrack(current)} hitSlop={12}>
            <DotsThreeVertical size={26} color={C.muted} weight="bold" />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.upNextHeader}>
        <Text style={styles.upNextTitle}>
          Up Next <Text style={styles.upNextCount}>{data.queue.length}</Text>
        </Text>
      </View>

      {data.queue.map((track, index) => (
        <View
          key={`${track.id}:${index}`}
          style={[
            styles.queueLine,
            index === data.index && styles.queueLineActive,
          ]}
        >
          {index === data.index ? (
            <Waveform size={20} color={C.accent} weight="bold" />
          ) : (
            <Artwork uri={track.cover} size={44} radius={8} />
          )}
          <Pressable
            style={styles.queueMain}
            onPress={() => void player.playAt(data.queue, index)} // Assuming playAt plays the track
          >
            <Text
              numberOfLines={1}
              style={[
                styles.queueTitle,
                index === data.index && { color: C.accent, fontWeight: "700" },
              ]}
            >
              {track.title}
            </Text>
            <Text numberOfLines={1} style={styles.queueArtist}>
              {track.artist}
            </Text>
          </Pressable>
          <Pressable hitSlop={12} onPress={() => player.removeQueued(index)}>
            <X size={20} color={C.muted} weight="bold" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 100 },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  playerHeaderTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  playerArt: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
    marginBottom: 40,
  },
  playerTitle: { color: C.text, fontSize: 28, fontWeight: "900", textAlign: "center" },
  playerArtist: { color: C.muted, fontSize: 18, marginTop: 8, textAlign: "center" },
  progressArea: { marginTop: 40, marginBottom: 20 },
  progress: {
    height: 48,
    justifyContent: "center",
    backgroundColor: C.lineStrong,
    borderRadius: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.text,
    borderRadius: 24,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  progressTime: { color: C.muted, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
  },
  mainPlayControl: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
  },
  skipControl: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryControl: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  playerSecondaryActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginTop: 32,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.lineStrong,
  },
  upNextHeader: { marginTop: 32, marginBottom: 16 },
  upNextTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  upNextCount: { color: C.muted, fontSize: 14, fontWeight: "500" },
  queueLine: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 14 },
  queueLineActive: { backgroundColor: C.panelStrong, marginHorizontal: -22, paddingHorizontal: 22 },
  queueMain: { flex: 1, justifyContent: "center" },
  queueTitle: { color: C.text, fontSize: 16, fontWeight: "600" },
  queueArtist: { color: C.muted, fontSize: 13.5, marginTop: 4 },
});
