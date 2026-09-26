import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Clock } from "phosphor-react-native";
import { usePlayer } from "../state/PlayerContext";
import { ScreenTitle, TrackRow as TrackLine } from "../ui/components";
import { C } from "../ui/theme";
import { timeAgo, useScreenContentPadding } from "../ui/utils";
import type { TabScreenProps } from "../navigation/types";

export function HistoryScreen({ navigation }: TabScreenProps<"History">) {
  const { data, clearHistory, playTrack, setActionTrack } = usePlayer();
  const contentPadding = useScreenContentPadding();

  return (
    <FlatList
      data={data.history}
      keyExtractor={(item, index) => `${item.playedAt}:${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, contentPadding]}
      ListHeaderComponent={
        <View style={styles.historyTitleRow}>
          <ScreenTitle
            title="Listening history"
            detail={`${data.history.length} listens · Recently played tracks`}
          />
          {!!data.history.length ? (
            <Pressable onPress={clearHistory} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>⌫ Clear all</Text>
            </Pressable>
          ) : null}
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={{ marginBottom: 10 }}>
          <TrackLine
            track={item.track}
            onPress={() => playTrack(item.track)}
            onMore={() => setActionTrack(item.track)}
            meta={timeAgo(item.playedAt)}
            card
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateIcon}>
            <Clock size={32} color={C.accent} weight="fill" />
          </View>
          <Text style={styles.emptyStateTitle}>Nothing played yet</Text>
          <Text style={styles.emptyStateText}>
            Tracks you play will show up here for quick access later.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22 },

  historyTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.panelStrong,
    borderWidth: 1,
    borderColor: C.lineStrong,
    marginTop: 8,
  },
  clearButtonText: { color: C.danger, fontWeight: "700", fontSize: 13 },
  historyList: { gap: 10, marginTop: 16 },
  emptyStateCard: {
    alignItems: "center",
    padding: 30,
    backgroundColor: C.panelStrong,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.lineStrong,
    marginTop: 20,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#A14BFF20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: { color: C.text, fontSize: 18, fontWeight: "700" },
  emptyStateText: {
    color: C.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
