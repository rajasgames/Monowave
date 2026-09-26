import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { CaretLeft, X } from "phosphor-react-native";
import { usePlayer } from "../state/PlayerContext";
import { ScreenTitle, Action, TrackRow as TrackLine } from "../ui/components";
import { C } from "../ui/theme";
import type { RootScreenProps } from "../navigation/types";
import { useScreenContentPadding } from "../ui/utils";

export function PlaylistScreen({
  route,
  navigation,
}: RootScreenProps<"Playlist">) {
  const { data, playTrack, removeFromPlaylist, deletePlaylist } = usePlayer();
  const { id } = route.params;
  const contentPadding = useScreenContentPadding({ isModal: true });

  const chosen = data.playlists.find((list) => list.id === id);

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
            <Action
              label="Play playlist"
              active
              wide
              onPress={() => playTrack(chosen.tracks[0], chosen.tracks)}
            />
          ) : null}
        </>
      }
      renderItem={({ item }) => (
        <TrackLine
          track={item}
          onPress={() => playTrack(item, chosen!.tracks)}
          onMore={() => removeFromPlaylist(chosen!.id, item.id)}
          trailing={<X size={20} color={C.muted} weight="bold" />}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.placeholder}>This playlist is empty.</Text>
      }
      ListFooterComponent={
        <View style={{ marginTop: 22 }}>
          <Action
            label="Delete playlist"
            danger
            onPress={() => {
              if (chosen) deletePlaylist(chosen.id);
              navigation.goBack();
            }}
          />
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
  placeholder: {
    color: C.faint,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
});
