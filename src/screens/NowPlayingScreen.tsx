import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  X,
} from "phosphor-react-native";
import { usePlayer } from "../state/PlayerContext";
import { Artwork, AnimatedWaveform } from "../ui/components";
import { C } from "../ui/theme";
import { formatTime } from "../ui/utils";
import type { RootScreenProps } from "../navigation/types";

export function NowPlayingScreen({ navigation }: RootScreenProps<"Player">) {
  const player = usePlayer();
  const { current, playing, position, duration, busy } = player;
  const { data } = player;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [barWidth, setBarWidth] = useState(1);
  const [actionTrack, setActionTrack] = useState<any>(null);
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!playing) {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.025,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, pulseAnim]);

  const displayDuration = duration || current?.duration || 0;
  const progressPercent = displayDuration
    ? (position / displayDuration) * 100
    : 0;

  // Responsive artwork sizing: adapts cleanly to small screens, rotation, and larger font settings
  const artSize = Math.min(
    Math.max(width - 64, 180),
    Math.min(height * 0.36, 320),
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <View style={styles.playerHeader}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.88 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to previous screen"
        >
          <CaretLeft size={28} color={C.text} weight="bold" />
        </Pressable>
        <Text style={styles.playerHeaderTitle}>Now Playing</Text>
        <Pressable
          onPress={() => current && setActionTrack(current)}
          hitSlop={12}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.88 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Track options"
        >
          <DotsThreeVertical size={28} color={C.text} weight="bold" />
        </Pressable>
      </View>
      <Animated.View
        style={[
          styles.playerArt,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Artwork uri={current?.cover} size={artSize} radius={20} />
      </Animated.View>
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
            player.seek(
              (event.nativeEvent.locationX / barWidth) * displayDuration,
            )
          }
          accessibilityRole="adjustable"
          accessibilityLabel="Track progress bar"
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
        <Pressable
          onPress={player.toggleShuffle}
          style={({ pressed }) => [
            styles.secondaryControl,
            { transform: [{ scale: pressed ? 0.88 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Toggle shuffle"
        >
          <Shuffle
            size={24}
            color={data.shuffle ? C.text : C.muted}
            weight="bold"
          />
        </Pressable>
        <Pressable
          onPress={player.previous}
          style={({ pressed }) => [
            styles.skipControl,
            { transform: [{ scale: pressed ? 0.88 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Previous track"
        >
          <SkipBack size={32} color={C.text} weight="fill" />
        </Pressable>
        <Pressable
          onPress={player.toggle}
          style={({ pressed }) => [
            styles.mainPlayControl,
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={playing ? "Pause track" : "Play track"}
        >
          {busy ? (
            <ActivityIndicator color={C.bg} size="large" />
          ) : playing ? (
            <Pause size={32} color={C.bg} weight="fill" />
          ) : (
            <Play size={32} color={C.bg} weight="fill" />
          )}
        </Pressable>
        <Pressable
          onPress={player.next}
          style={({ pressed }) => [
            styles.skipControl,
            { transform: [{ scale: pressed ? 0.88 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next track"
        >
          <SkipForward size={32} color={C.text} weight="fill" />
        </Pressable>
        <Pressable
          onPress={player.cycleRepeat}
          style={({ pressed }) => [
            styles.secondaryControl,
            { transform: [{ scale: pressed ? 0.88 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Toggle repeat"
        >
          <Repeat
            size={24}
            color={data.repeat !== "off" ? C.text : C.muted}
            weight="bold"
          />
        </Pressable>
      </View>

      {!!current ? (
        <View style={styles.playerSecondaryActions}>
          <Pressable
            onPress={() => player.like(current)}
            hitSlop={12}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.85 : 1 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              data.liked.some((t) => t.id === current.id) ? "Unlike" : "Like"
            }
          >
            {data.liked.some((t) => t.id === current.id) ? (
              <Heart size={26} color={C.accent} weight="fill" />
            ) : (
              <Heart size={26} color={C.muted} />
            )}
          </Pressable>
          <Pressable
            onPress={() => setActionTrack(current)}
            hitSlop={12}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.85 : 1 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add to playlist"
          >
            <Plus size={26} color={C.muted} />
          </Pressable>
          <Pressable
            onPress={() => setActionTrack(current)}
            hitSlop={12}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.85 : 1 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
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
            <AnimatedWaveform
              size={20}
              color={C.accent}
              animating={playing}
              barCount={3}
            />
          ) : (
            <Artwork uri={track.cover} size={44} radius={8} />
          )}
          <Pressable
            style={({ pressed }) => [
              styles.queueMain,
              pressed && { opacity: 0.75 },
            ]}
            onPress={() => void player.playAt(data.queue, index)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${track.title} by ${track.artist}`}
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
          <Pressable
            hitSlop={12}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.85 : 1 }] },
            ]}
            onPress={() => player.removeQueued(index)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${track.title} from queue`}
          >
            <X size={20} color={C.muted} weight="bold" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22 },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
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
    marginBottom: 28,
  },
  playerTitle: {
    color: C.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  playerArtist: {
    color: C.muted,
    fontSize: 17,
    marginTop: 6,
    textAlign: "center",
  },
  progressArea: { marginTop: 28, marginBottom: 16 },
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
    marginTop: 10,
    paddingHorizontal: 8,
  },
  progressTime: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
  },
  mainPlayControl: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
  },
  skipControl: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryControl: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  playerSecondaryActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginTop: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.lineStrong,
  },
  upNextHeader: { marginTop: 28, marginBottom: 14 },
  upNextTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  upNextCount: { color: C.muted, fontSize: 14, fontWeight: "500" },
  queueLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 14,
  },
  queueLineActive: {
    backgroundColor: C.panelStrong,
    marginHorizontal: -22,
    paddingHorizontal: 22,
  },
  queueMain: { flex: 1, justifyContent: "center" },
  queueTitle: { color: C.text, fontSize: 16, fontWeight: "600" },
  queueArtist: { color: C.muted, fontSize: 13.5, marginTop: 4 },
});
