import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { View, Pressable, Text, Modal, StyleSheet } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StateProvider, usePlayer } from "./state/PlayerContext";
import { RootNavigator } from "./navigation/RootNavigator";
import { MiniPlayer, Artwork } from "./ui/components";
import { C } from "./ui/theme";
import { Heart, Play } from "phosphor-react-native";
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
} from "@react-navigation/native";
import type { RootStackParamList } from "./navigation/types";

function AppContent() {
  const player = usePlayer();
  const { actionTrack, setActionTrack } = player;
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [routeName, setRouteName] = useState<string | undefined>("Home");
  const insets = useSafeAreaInsets();

  const onReady = () => {
    setRouteName(navigationRef.getCurrentRoute()?.name);
  };
  const onStateChange = () => {
    setRouteName(navigationRef.getCurrentRoute()?.name);
  };

  const showMiniPlayer = player.current && routeName !== "Player";
  const tabHeight = 56 + insets.bottom;
  const miniPlayerBottom = tabHeight + 10; // 8-12dp above tab bar

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <NavigationContainer
        ref={navigationRef}
        onReady={onReady}
        onStateChange={onStateChange}
        theme={{
          ...DefaultTheme,
          dark: true,
          colors: {
            ...DefaultTheme.colors,
            primary: C.accent,
            background: C.bg,
            card: C.panelStrong,
            text: C.text,
            border: C.lineStrong,
            notification: C.accent,
          },
        }}
      >
        <RootNavigator />
      </NavigationContainer>

      {showMiniPlayer ? (
        <View
          style={[styles.miniPlayerContainer, { bottom: miniPlayerBottom }]}
        >
          <MiniPlayer
            track={player.current!}
            playing={player.playing}
            position={player.position}
            duration={player.duration || player.current!.duration || 0}
            onOpen={() => navigationRef.navigate("Player" as never)}
            onToggle={player.toggle}
            onLike={() => player.like(player.current!)}
            liked={player.data.liked.some((t) => t.id === player.current!.id)}
          />
        </View>
      ) : null}

      <Modal
        visible={!!actionTrack}
        transparent
        animationType="slide"
        onRequestClose={() => setActionTrack(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setActionTrack(null)}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) + 16 },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTrackHeader}>
              <Artwork uri={actionTrack?.cover} size={66} radius={16} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.sheetTitle}>
                  {actionTrack?.title ?? ""}
                </Text>
                <Text numberOfLines={1} style={styles.sheetSubtitle}>
                  {actionTrack?.artist}
                </Text>
              </View>
            </View>
            {actionTrack ? (
              <View style={styles.sheetActions}>
                <Pressable
                  onPress={() => {
                    player.playTrack(actionTrack, [actionTrack]);
                    setActionTrack(null);
                  }}
                  style={styles.sheetActionItem}
                >
                  <Play size={24} color={C.text} weight="fill" />
                  <Text style={styles.sheetActionText}>Play next</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    player.like(actionTrack);
                    setActionTrack(null);
                  }}
                  style={styles.sheetActionItem}
                >
                  <Heart
                    size={24}
                    color={
                      player.data.liked.some((t) => t.id === actionTrack.id)
                        ? C.accent
                        : C.text
                    }
                    weight={
                      player.data.liked.some((t) => t.id === actionTrack.id)
                        ? "fill"
                        : "regular"
                    }
                  />
                  <Text style={styles.sheetActionText}>
                    {player.data.liked.some((t) => t.id === actionTrack.id)
                      ? "Unlike"
                      : "Like"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StateProvider>
        <AppContent />
      </StateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  miniPlayerContainer: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 99,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.panelStrong,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderTopWidth: 1,
    borderColor: C.lineStrong,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.lineStrong,
    alignSelf: "center",
    marginBottom: 24,
  },
  sheetTrackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderColor: C.lineStrong,
    marginBottom: 16,
  },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  sheetSubtitle: { color: C.muted, fontSize: 15, marginTop: 4 },
  sheetActions: { gap: 8 },
  sheetActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  sheetActionText: { color: C.text, fontSize: 16, fontWeight: "600" },
});
