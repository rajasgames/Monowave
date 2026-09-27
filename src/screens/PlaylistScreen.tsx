import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { CaretLeft, X, Shuffle, Play } from "phosphor-react-native";
import { usePlayer } from "../state/PlayerContext";
import { ScreenTitle, Action, TrackRow as TrackLine } from "../ui/components";
import { C } from "../ui/theme";
import type { RootScreenProps } from "../navigation/types";
import { useScreenContentPadding } from "../ui/utils";

export function PlaylistScreen({
  route,
  navigation,
}: RootScreenProps<"Playlist">) {
  const { data, playTrack, removeFromPlaylist, deletePlaylist, toggleShuffle } =
    usePlayer();
  const { id } = route.params;
  const contentPadding = useScreenContentPadding({ isModal: true });

  const chosen = data.playlists.find((list) => list.id === id);

  const confirmDelete = () => {
    if (!chosen) return;
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${chosen.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePlaylist(chosen.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const confirmRemoveTrack = (trackId: string, trackTitle: string) => {
    if (!chosen) return;
    Alert.alert("Remove Track", `Remove "${trackTitle}" from ${chosen.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFromPlaylist(chosen.id, trackId),
      },
    ]);
  };

  const handleShufflePlay = () => {
    if (!chosen?.tracks.length) return;
    const randomIdx = Math.floor(Math.random() * chosen.tracks.length);
    toggleShuffle();
    playTrack(chosen.tracks[randomIdx], chosen.tracks);
  };

  return (
    <FlatList
      data={chosen?.tracks ?? []}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, contentPadding]}
      ListHeaderComponent={
        <>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to library"
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <CaretLeft size={18} color={C.accent} weight="bold" />
              <Text style={styles.backButtonText}>Library</Text>
            </View>
          </Pressable>
          <ScreenTitle
            title={chosen?.name ?? "Playlist"}
            detail={`${chosen?.tracks.length ?? 0} tracks`}
          />
          {!!chosen?.tracks.length ? (
            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}>
                <Action
                  label="Play playlist"
                  active
                  wide
                  onPress={() => playTrack(chosen.tracks[0], chosen.tracks)}
                />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.shuffleButton,
                  { transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
                onPress={handleShufflePlay}
                accessibilityRole="button"
                accessibilityLabel="Shuffle play playlist"
              >
                <Shuffle size={20} color={C.text} weight="bold" />
              </Pressable>
            </View>
          ) : null}
        </>
      }
      renderItem={({ item }) => (
        <TrackLine
          track={item}
          onPress={() => playTrack(item, chosen!.tracks)}
          onMore={() => confirmRemoveTrack(item.id, item.title)}
          trailing={<X size={20} color={C.muted} weight="bold" />}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.placeholder}>This playlist is empty.</Text>
      }
      ListFooterComponent={
        <View style={{ marginTop: 22 }}>
          <Action label="Delete playlist" danger onPress={confirmDelete} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22 },
  backButton: { marginBottom: 16 },
  backButtonText: {
    color: C.accent,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  shuffleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.panelStrong,
    borderWidth: 1,
    borderColor: C.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    color: C.faint,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
});
